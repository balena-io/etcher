/*
 * Copyright 2016 Resin.io
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
const Store = require('./models/store');

const app = angular.module('Etcher', [
  require('angular-ui-router'),
  require('angular-ui-bootstrap'),
  require('angular-moment'),
  require('angular-middle-ellipses'),
  require('angular-if-state'),
  require('angular-seconds-to-date'),

  // Etcher modules
  require('./modules/drive-scanner'),
  require('./modules/image-writer'),
  require('./modules/analytics'),

  // Models
  require('./models/selection-state'),
  require('./models/settings'),
  require('./models/supported-formats'),
  require('./models/drives'),

  // Components
  require('./components/progress-button/progress-button'),
  require('./components/drive-selector/drive-selector'),
  require('./components/svg-icon/svg-icon'),
  require('./components/update-notifier/update-notifier'),
  require('./components/tooltip-modal/tooltip-modal'),

  // Pages
  require('./pages/finish/finish'),
  require('./pages/settings/settings'),

  // OS
  require('./os/notification/notification'),
  require('./os/window-progress/window-progress'),
  require('./os/open-external/open-external'),
  require('./os/dropzone/dropzone'),
  require('./os/dialog/dialog'),

  // Utils
  require('./utils/path/path'),
  require('./utils/manifest-bind/manifest-bind'),
  require('./utils/byte-size/byte-size')
]);

app.run((AnalyticsService, UpdateNotifierService, SelectionStateModel) => {
  AnalyticsService.logEvent('Application start');

  if (UpdateNotifierService.shouldCheckForUpdates()) {
    AnalyticsService.logEvent('Checking for updates');

    UpdateNotifierService.isLatestVersion().then((isLatestVersion) => {

      // In case the internet connection is not good and checking the
      // latest published version takes too long, only show notify
      // the user about the new version if he didn't start the flash
      // process (e.g: selected an image), otherwise such interruption
      // might be annoying.
      if (!isLatestVersion && !SelectionStateModel.hasImage()) {

        AnalyticsService.logEvent('Notifying update');
        UpdateNotifierService.notify();
      }
    });
  }

});

app.run((AnalyticsService, OSWindowProgressService, ImageWriterService) => {
  Store.subscribe(() => {
    const state = Store.getState().toJS();

    // There is usually a short time period between the `isFlashing()`
    // property being set, and the flashing actually starting, which
    // might cause some non-sense flashing state logs including
    // `undefined` values.
    //
    // We use the presence of `.eta` to determine that the actual
    // writing started.
    if (!ImageWriterService.isFlashing() || !state.flashState.eta) {
      return;
    }

    AnalyticsService.log([
      `Progress (${state.flashState.type}):`,
      `${state.flashState.percentage}% at ${state.flashState.speed} MB/s`,
      `(eta ${state.flashState.eta}s)`
    ].join(' '));

    OSWindowProgressService.set(state.flashState.percentage);
  });
});

app.config(($stateProvider, $urlRouterProvider) => {
  $urlRouterProvider.otherwise('/main');

  $stateProvider
    .state('main', {
      url: '/main',
      controller: 'AppController as app',
      templateUrl: './partials/main.html'
    });
});

app.controller('AppController', function(
  $state,
  $scope,
  DriveScannerService,
  SelectionStateModel,
  SettingsModel,
  SupportedFormatsModel,
  DrivesModel,
  ImageWriterService,
  AnalyticsService,
  DriveSelectorService,
  UpdateNotifierService,
  TooltipModalService,
  OSWindowProgressService,
  OSNotificationService,
  OSDialogService
) {
  this.formats = SupportedFormatsModel;
  this.selection = SelectionStateModel;
  this.drives = DrivesModel;
  this.writer = ImageWriterService;
  this.settings = SettingsModel;
  this.tooltipModal = TooltipModalService;

  this.handleError = (error) => {
    OSDialogService.showError(error);

    // Also throw it so it gets displayed in DevTools
    // and its reported by TrackJS.
    throw error;
  };

  // This catches the case where the user enters
  // the settings screen when a flash finished
  // and goes back to the main screen with the back button.
  if (!this.writer.isFlashing()) {

    this.selection.clear({

      // Preserve image, in case there is one, otherwise
      // we revert the behaviour of "Use same image".
      preserveImage: true

    });
  }

  DriveScannerService.start();

  DriveScannerService.on('error', this.handleError);

  DriveScannerService.on('drives', (drives) => {
    this.drives.setDrives(drives);

    if (_.isEmpty(drives)) {
      DriveSelectorService.close();
    }
  });

  this.selectImage = (image) => {
    if (!SupportedFormatsModel.isSupportedImage(image.path)) {
      OSDialogService.showError('Invalid image', `${image.path} is not a supported image type.`);
      AnalyticsService.logEvent('Invalid image', image);
      return;
    }

    this.selection.setImage(image);
    AnalyticsService.logEvent('Select image', image);
  };

  this.openImageSelector = () => {
    return OSDialogService.selectImage().then((image) => {

      // Avoid analytics and selection state changes
      // if no file was resolved from the dialog.
      if (!image) {
        return;
      }

      this.selectImage(image);
    }).catch(this.handleError);
  };

  this.selectDrive = (drive) => {
    if (!drive) {
      return;
    }

    this.selection.setDrive(drive);

    AnalyticsService.logEvent('Select drive', {
      device: drive.device
    });
  };

  this.openDriveSelector = () => {
    DriveSelectorService.open()
      .then(this.selectDrive)
      .catch(this.handleError);
  };

  this.reselectImage = () => {
    if (this.writer.isFlashing()) {
      return;
    }

    // Reselecting an image automatically
    // de-selects the current drive, if any.
    // This is made so the user effectively
    // "returns" to the first step.
    this.selection.clear();

    this.openImageSelector();
    AnalyticsService.logEvent('Reselect image');
  };

  this.reselectDrive = () => {
    if (this.writer.isFlashing()) {
      return;
    }

    this.openDriveSelector();
    AnalyticsService.logEvent('Reselect drive');
  };

  this.restartAfterFailure = () => {
    this.selection.clear({
      preserveImage: true
    });

    this.writer.resetState();
    AnalyticsService.logEvent('Restart after failure');
  };

  this.wasLastFlashSuccessful = () => {
    return _.get(this.writer.getFlashResults(), 'passedValidation', true);
  };

  this.flash = (image, drive) => {

    if (this.writer.isFlashing()) {
      return;
    }

    // Stop scanning drives when flashing
    // otherwise Windows throws EPERM
    DriveScannerService.stop();

    AnalyticsService.logEvent('Flash', {
      image: image,
      device: drive.device
    });

    return this.writer.flash(image, drive).then(() => {
      const results = ImageWriterService.getFlashResults();

      if (results.cancelled) {
        return;
      }

      if (results.passedValidation) {
        OSNotificationService.send('Success!', 'Your flash is complete');
        AnalyticsService.logEvent('Done');
        $state.go('success');
      } else {
        OSNotificationService.send('Oops!', 'Looks like your flash has failed');
        AnalyticsService.logEvent('Validation error');
      }
    })
    .catch((error) => {

      if (error.type === 'check') {
        AnalyticsService.logEvent('Validation error');
      } else {
        AnalyticsService.logEvent('Flash error');
      }

      this.handleError(error);
    })
    .finally(OSWindowProgressService.clear);
  };
});
