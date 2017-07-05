/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @module Etcher
 */

'use strict';

/* eslint-disable no-var */

var angular = require('angular');

/* eslint-enable no-var */

const electron = require('electron');
const Bluebird = require('bluebird');
const semver = require('semver');
const EXIT_CODES = require('../shared/exit-codes');
const messages = require('../shared/messages');
const s3Packages = require('../shared/s3-packages');
const release = require('../shared/release');
const store = require('../shared/store');
const packageJSON = require('../../package.json');
const flashState = require('./models/flash-state');
const settings = require('./models/settings');
const windowProgress = require('./os/window-progress');
const analytics = require('./modules/analytics');
const updateNotifier = require('./components/update-notifier');
const availableDrives = require('./models/available-drives');
const selectionState = require('./models/selection-state');
const driveScanner = require('./modules/drive-scanner');
const osDialog = require('./os/dialog');
const exceptionReporter = require('./modules/exception-reporter');

const app = angular.module('Etcher', [
  require('angular-ui-router'),
  require('angular-ui-bootstrap'),
  require('angular-if-state'),

  // Components
  require('./components/svg-icon'),
  require('./components/warning-modal/warning-modal'),
  require('./components/safe-webview'),

  // Pages
  require('./pages/main/main'),
  require('./pages/finish/finish'),
  require('./pages/settings/settings'),

  // OS
  require('./os/open-external/open-external'),
  require('./os/dropzone/dropzone'),

  // Utils
  require('./utils/manifest-bind/manifest-bind')
]);

app.run(() => {
  console.log([
    ' _____ _       _',
    '|  ___| |     | |',
    '| |__ | |_ ___| |__   ___ _ __',
    '|  __|| __/ __| \'_ \\ / _ \\ \'__|',
    '| |___| || (__| | | |  __/ |',
    '\\____/ \\__\\___|_| |_|\\___|_|',
    '',
    'Interested in joining the Etcher team?',
    'Drop us a line at join+etcher@resin.io'
  ].join('\n'));
});

app.run(() => {
  analytics.logEvent('Application start');
  settings.load();

  const currentVersion = packageJSON.version;
  const shouldCheckForUpdates = updateNotifier.shouldCheckForUpdates({
    currentVersion: packageJSON.version,
    lastSleptUpdateNotifier: settings.get('lastSleptUpdateNotifier'),
    lastSleptUpdateNotifierVersion: settings.get('lastSleptUpdateNotifierVersion')
  });

  const currentReleaseType = release.getReleaseType(currentVersion);
  const updatesEnabled = settings.get('updatesEnabled');

  if (!shouldCheckForUpdates || !updatesEnabled) {
    analytics.logEvent('Not checking for updates', {
      shouldCheckForUpdates,
      updatesEnabled,
      releaseType: currentReleaseType
    });
    return;
  }

  const updateSemverRange = packageJSON.updates.semverRange;
  const includeUnstableChannel = settings.get('includeUnstableUpdateChannel');

  analytics.logEvent('Checking for updates', {
    currentVersion,
    releaseType: currentReleaseType,
    updateSemverRange,
    includeUnstableChannel
  });

  s3Packages.getLatestVersion(currentReleaseType, {
    range: updateSemverRange,
    includeUnstableChannel
  }).then((latestVersion) => {
    if (semver.gte(currentVersion, latestVersion || '0.0.0')) {
      analytics.logEvent('Update notification skipped', {
        reason: 'Latest version'
      });
      return Bluebird.resolve();
    }

    // In case the internet connection is not good and checking the
    // latest published version takes too long, only show notify
    // the user about the new version if he didn't start the flash
    // process (e.g: selected an image), otherwise such interruption
    // might be annoying.
    if (selectionState.hasImage()) {
      analytics.logEvent('Update notification skipped', {
        reason: 'Image selected'
      });
      return Bluebird.resolve();
    }

    analytics.logEvent('Notifying update', {
      latestVersion
    });

    return updateNotifier.notify(latestVersion, {
      allowSleepUpdateCheck: currentReleaseType === release.RELEASE_TYPE.PRODUCTION
    });
  }).catch(exceptionReporter.report);
});

app.run(() => {
  store.subscribe(() => {
    const currentFlashState = flashState.getFlashState();

    // There is usually a short time period between the `isFlashing()`
    // property being set, and the flashing actually starting, which
    // might cause some non-sense flashing state logs including
    // `undefined` values.
    //
    // We use the presence of `.eta` to determine that the actual
    // writing started.
    if (!flashState.isFlashing() || !currentFlashState.eta) {
      return;
    }

    analytics.logDebug([
      `Progress (${currentFlashState.type}):`,
      `${currentFlashState.percentage}% at ${currentFlashState.speed} MB/s`,
      `(eta ${currentFlashState.eta}s)`
    ].join(' '));

    windowProgress.set(currentFlashState.percentage);
  });
});

app.run(($timeout) => {
  driveScanner.on('drives', (drives) => {

    // Safely trigger a digest cycle.
    // In some cases, AngularJS doesn't acknowledge that the
    // available drives list has changed, and incorrectly
    // keeps asking the user to "Connect a drive".
    $timeout(() => {
      availableDrives.setDrives(drives);
    });
  });

  driveScanner.on('error', (error) => {

    // Stop the drive scanning loop in case of errors,
    // otherwise we risk presenting the same error over
    // and over again to the user, while also heavily
    // spamming our error reporting service.
    driveScanner.stop();

    return exceptionReporter.report(error);
  });

  driveScanner.start();
});

app.run(($window) => {
  let popupExists = false;

  $window.addEventListener('beforeunload', (event) => {
    if (!flashState.isFlashing() || popupExists) {
      analytics.logEvent('Close application', {
        isFlashing: flashState.isFlashing()
      });
      return;
    }

    // Don't close window while flashing
    event.returnValue = false;

    // Don't open any more popups
    popupExists = true;

    analytics.logEvent('Close attempt while flashing');

    osDialog.showWarning({
      confirmationLabel: 'Yes, quit',
      rejectionLabel: 'Cancel',
      title: 'Are you sure you want to close Etcher?',
      description: messages.warning.exitWhileFlashing()
    }).then((confirmed) => {
      if (confirmed) {
        analytics.logEvent('Close confirmed while flashing', {
          uuid: flashState.getFlashUuid()
        });

        // This circumvents the 'beforeunload' event unlike
        // electron.remote.app.quit() which does not.
        electron.remote.process.exit(EXIT_CODES.SUCCESS);

      }

      analytics.logEvent('Close rejected while flashing');
      popupExists = false;
    }).catch(exceptionReporter.report);
  });
});

app.run(($rootScope) => {
  $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState) => {

    // Ignore first navigation
    if (!fromState.name) {
      return;
    }

    analytics.logEvent('Navigate', {
      to: toState.name,
      from: fromState.name
    });
  });
});

app.config(($urlRouterProvider) => {
  $urlRouterProvider.otherwise('/main');
});

app.config(($provide) => {
  $provide.decorator('$exceptionHandler', ($delegate) => {
    return (except, cause) => {
      exceptionReporter.report(except);
      $delegate(except, cause);
    };
  });
});

app.controller('HeaderController', function(OSOpenExternalService) {

  /**
   * @summary Open help page
   * @function
   * @public
   *
   * @description
   * This application will open either the image's support url, declared
   * in the archive `manifest.json`, or the default Etcher help page.
   *
   * @example
   * HeaderController.openHelpPage();
   */
  this.openHelpPage = () => {
    const DEFAULT_SUPPORT_URL = 'https://github.com/resin-io/etcher/blob/master/SUPPORT.md';
    const supportUrl = selectionState.getImageSupportUrl() || DEFAULT_SUPPORT_URL;
    OSOpenExternalService.open(supportUrl);
  };

});

app.controller('StateController', function($rootScope, $scope) {
  const unregisterStateChange = $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState) => {
    this.previousName = fromState.name;
    this.currentName = toState.name;
  });

  $scope.$on('$destroy', unregisterStateChange);

  /**
   * @summary Get the previous state name
   * @function
   * @public
   *
   * @returns {String} previous state name
   *
   * @example
   * if (StateController.previousName === 'main') {
   *   console.log('We left the main screen!');
   * }
   */
  this.previousName = null;

  /**
   * @summary Get the current state name
   * @function
   * @public
   *
   * @returns {String} current state name
   *
   * @example
   * if (StateController.currentName === 'main') {
   *   console.log('We are on the main screen!');
   * }
   */
  this.currentName = null;

});
