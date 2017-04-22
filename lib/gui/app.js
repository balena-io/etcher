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

const _ = require('lodash');
const electron = require('electron');
const Bluebird = require('bluebird');
const EXIT_CODES = require('../shared/exit-codes');
const messages = require('../shared/messages');
const packageJSON = require('../../package.json');
const flashState = require('./models/flash-state');
const windowProgress = require('./os/window-progress');
const nodeAnalytics = require('../shared/analytics');


const Store = require('./models/store');

const app = angular.module('Etcher', [
  require('angular-ui-router'),
  require('angular-ui-bootstrap'),
  require('angular-if-state'),

  // Etcher modules
  require('./modules/analytics'),
  require('./modules/error'),
  require('./modules/drive-scanner'),

  // Models
  require('./models/selection-state'),
  require('./models/drives'),

  // Components
  require('./components/svg-icon/svg-icon'),
  require('./components/update-notifier/update-notifier'),
  require('./components/warning-modal/warning-modal'),

  // Pages
  require('./pages/main/main'),
  require('./pages/finish/finish'),
  require('./pages/settings/settings'),

  // OS
  require('./os/open-external/open-external'),
  require('./os/dropzone/dropzone'),
  require('./os/dialog/dialog'),

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

app.run((AnalyticsService, ErrorService, UpdateNotifierService, SelectionStateModel) => {
  AnalyticsService.logEvent('Application start');

  const shouldCheckForUpdates = UpdateNotifierService.shouldCheckForUpdates();

  if (!shouldCheckForUpdates || process.env.ETCHER_DISABLE_UPDATES) {
    AnalyticsService.logEvent('Not checking for updates', {
      shouldCheckForUpdates,
      disableUpdatesEnvironmentVariable: process.env.ETCHER_DISABLE_UPDATES
    });
    return;
  }

  AnalyticsService.logEvent('Checking for updates', {
    currentVersion: packageJSON.version
  });

  UpdateNotifierService.isLatestVersion().then((isLatestVersion) => {

    if (isLatestVersion) {
      AnalyticsService.logEvent('Update notification skipped', {
        reason: 'Latest version'
      });
      return Bluebird.resolve();
    }

    // In case the internet connection is not good and checking the
    // latest published version takes too long, only show notify
    // the user about the new version if he didn't start the flash
    // process (e.g: selected an image), otherwise such interruption
    // might be annoying.
    if (SelectionStateModel.hasImage()) {
      AnalyticsService.logEvent('Update notification skipped', {
        reason: 'Image selected'
      });
      return Bluebird.resolve();
    }

    AnalyticsService.logEvent('Notifying update');

    return UpdateNotifierService.notify();

  }).catch(ErrorService.reportException);

});

app.run((AnalyticsService) => {
  Store.subscribe(() => {
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

    AnalyticsService.logDebug([
      `Progress (${currentFlashState.type}):`,
      `${currentFlashState.percentage}% at ${currentFlashState.speed} MB/s`,
      `(eta ${currentFlashState.eta}s)`
    ].join(' '));

    windowProgress.set(currentFlashState.percentage);
  });
});

app.run(() => {
  Store.subscribe(() => {
    if (Store.getState().get('settings').toJS().errorReporting) {
      nodeAnalytics.enable();
    } else {
      nodeAnalytics.disable();
    }
  });
});

app.run(($timeout, DriveScannerService, DrivesModel, ErrorService) => {
  DriveScannerService.on('drives', (drives) => {

    // Safely trigger a digest cycle.
    // In some cases, AngularJS doesn't acknowledge that the
    // available drives list has changed, and incorrectly
    // keeps asking the user to "Connect a drive".
    $timeout(() => {
      if (!_.isEqual(DrivesModel.getDrives(), drives)) {
        DrivesModel.setDrives(drives);
      }
    });
  });

  DriveScannerService.on('error', (error) => {

    // Stop the drive scanning loop in case of errors,
    // otherwise we risk presenting the same error over
    // and over again to the user, while also heavily
    // spamming our error reporting service.
    DriveScannerService.stop();

    return ErrorService.reportException(error);
  });

  DriveScannerService.start();
});

app.run(($window, AnalyticsService, WarningModalService, ErrorService, OSDialogService) => {
  let popupExists = false;

  $window.addEventListener('beforeunload', (event) => {
    if (!flashState.isFlashing() || popupExists) {
      AnalyticsService.logEvent('Close application', {
        isFlashing: flashState.isFlashing()
      });
      return;
    }

    // Don't close window while flashing
    event.returnValue = false;

    // Don't open any more popups
    popupExists = true;

    AnalyticsService.logEvent('Close attempt while flashing');

    OSDialogService.showWarning({
      confirmationLabel: 'Yes, quit',
      rejectionLabel: 'Cancel',
      title: 'Are you sure you want to close Etcher?',
      description: messages.warning.exitWhileFlashing()
    }).then((confirmed) => {
      if (confirmed) {
        AnalyticsService.logEvent('Close confirmed while flashing');

        // This circumvents the 'beforeunload' event unlike
        // electron.remote.app.quit() which does not.
        electron.remote.process.exit(EXIT_CODES.SUCCESS);

      }

      AnalyticsService.logEvent('Close rejected while flashing');
      popupExists = false;
    }).catch(ErrorService.reportException);
  });
});

app.run(($rootScope, AnalyticsService) => {
  $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState) => {

    // Ignore first navigation
    if (!fromState.name) {
      return;
    }

    AnalyticsService.logEvent('Navigate', {
      to: toState.name,
      from: fromState.name
    });
  });
});

app.config(($urlRouterProvider) => {
  $urlRouterProvider.otherwise('/main');
});

app.config(($provide) => {
  $provide.decorator('$exceptionHandler', ($delegate, $injector) => {
    return (exception, cause) => {
      const ErrorService = $injector.get('ErrorService');
      ErrorService.reportException(exception);
      $delegate(exception, cause);
    };
  });
});

app.controller('HeaderController', function(SelectionStateModel, OSOpenExternalService) {

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
    const supportUrl = SelectionStateModel.getImageSupportUrl() || DEFAULT_SUPPORT_URL;
    OSOpenExternalService.open(supportUrl);
  };

});
