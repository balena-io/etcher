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

var angular = require('angular');
const _ = require('lodash');
const electron = require('electron');
const dialog = electron.remote.require('./src/dialog');

const app = angular.module('Etcher', [
  require('angular-ui-router'),

  // Etcher modules
  require('./browser/modules/drive-scanner'),
  require('./browser/modules/image-writer'),
  require('./browser/modules/analytics'),

  // Models
  require('./browser/models/selection-state'),
  require('./browser/models/settings'),

  // Components
  require('./browser/components/progress-button/progress-button'),
  require('./browser/components/drive-selector/drive-selector'),
  require('./browser/components/svg-icon/svg-icon'),

  // Pages
  require('./browser/pages/finish/finish'),
  require('./browser/pages/settings/settings'),

  // OS
  require('./browser/os/notification/notification'),
  require('./browser/os/window-progress/window-progress'),
  require('./browser/os/open-external/open-external'),
  require('./browser/os/dropzone/dropzone'),

  // Utils
  require('./browser/utils/if-state/if-state'),
  require('./browser/utils/notifier/notifier'),
  require('./browser/utils/path/path'),
  require('./browser/utils/manifest-bind/manifest-bind')
]);

app.run(function(AnalyticsService) {
  AnalyticsService.logEvent('Application start');
});

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/main');

  $stateProvider
    .state('main', {
      url: '/main',
      controller: 'AppController as app',
      templateUrl: './partials/main.html'
    });
});

app.controller('AppController', function(
  $q,
  $state,
  $scope,
  NotifierService,
  DriveScannerService,
  SelectionStateModel,
  SettingsModel,
  ImageWriterService,
  AnalyticsService,
  DriveSelectorService,
  OSWindowProgressService,
  OSNotificationService
) {
  let self = this;
  this.selection = SelectionStateModel;
  this.writer = ImageWriterService;
  this.scanner = DriveScannerService;
  this.settings = SettingsModel.data;
  this.success = true;

  // This catches the case where the user enters
  // the settings screen when a flash finished
  // and goes back to the main screen with the back button.
  if (!this.writer.isFlashing()) {

    this.selection.clear({

      // Preserve image, in case there is one, otherwise
      // we revert the behaviour of "Use same image".
      preserveImage: true

    });

    this.writer.resetState();
  }

  NotifierService.subscribe($scope, 'image-writer:state', function(state) {
    AnalyticsService.log(`Progress (${state.type}): ${state.progress}% at ${state.speed} MB/s`);
    OSWindowProgressService.set(state.progress);
  });

  this.scanner.start(2000).on('error', dialog.showError).on('scan', function(drives) {

    // Cover the case where you select a drive, but then eject it.
    if (self.selection.hasDrive() && !_.find(drives, self.selection.isCurrentDrive)) {
      self.selection.removeDrive();
    }

    if (_.isEmpty(drives)) {
      DriveSelectorService.close();
    }

    // Notice we only autoselect the drive if there is an image,
    // which means that the first step was completed successfully,
    // otherwise the drive is selected while the drive step is disabled
    // which looks very weird.
    if (drives.length === 1 && self.selection.hasImage()) {
      const drive = _.first(drives);

      // Do not autoselect the same drive over and over again
      // and fill the logs unnecessary.
      // `angular.equals` is used instead of `_.isEqual` to
      // cope with `$$hashKey`.
      if (!angular.equals(self.selection.getDrive(), drive)) {
        AnalyticsService.logEvent('Auto-select drive', {
          device: drive.device
        });
        self.selectDrive(drive);
      }

    }
  });

  // We manually add `style="display: none;"` to <body>
  // and unset it here instead of using ngCloak since
  // the latter takes effect as soon as the Angular
  // library was loaded, but doesn't always mean that
  // the application is ready, causing the application
  // to be shown in an unitialized state for some milliseconds.
  // Here in the controller, we are sure things are
  // completely up and running.
  document.querySelector('body').style.display = 'initial';

  this.selectImage = function(image) {
    self.selection.setImage(image);
    AnalyticsService.logEvent('Select image', {
      image: image
    });
  };

  this.openImageSelector = function() {
    return $q.when(dialog.selectImage()).then(function(image) {

      // Avoid analytics and selection state changes
      // if no file was resolved from the dialog.
      if (!image) {
        return;
      }

      self.selectImage(image);
    });
  };

  this.selectDrive = function(drive) {
    self.selection.setDrive(drive);

    AnalyticsService.logEvent('Select drive', {
      device: drive.device
    });
  };

  this.openDriveSelector = function() {
    DriveSelectorService.open().then(self.selectDrive);
  };

  this.reselectImage = function() {
    if (self.writer.isFlashing()) {
      return;
    }

    // Reselecting an image automatically
    // de-selects the current drive, if any.
    // This is made so the user effectively
    // "returns" to the first step.
    self.selection.clear();

    self.openImageSelector();
    AnalyticsService.logEvent('Reselect image');
  };

  this.reselectDrive = function() {
    if (self.writer.isFlashing()) {
      return;
    }

    self.openDriveSelector();
    AnalyticsService.logEvent('Reselect drive');
  };

  this.restartAfterFailure = function() {
    self.selection.clear({
      preserveImage: true
    });

    self.writer.resetState();
    self.success = true;
    AnalyticsService.logEvent('Restart after failure');
  };

  this.flash = function(image, drive) {

    // Stop scanning drives when flashing
    // otherwise Windows throws EPERM
    self.scanner.stop();

    AnalyticsService.logEvent('Flash', {
      image: image,
      device: drive.device
    });

    return self.writer.flash(image, drive).then(function(success) {

      // TODO: Find a better way to manage flash/check
      // success/error state than a global boolean flag.
      self.success = success;

      if (self.success) {
        OSNotificationService.send('Success!', 'Your flash is complete');
        AnalyticsService.logEvent('Done');
        $state.go('success');
      } else {
        OSNotificationService.send('Oops!', 'Looks like your flash has failed');
        AnalyticsService.logEvent('Validation error');
      }
    })
    .catch(function(error) {

      if (error.type === 'check') {
        AnalyticsService.logEvent('Validation error');
      } else {
        AnalyticsService.logEvent('Flash error');
      }

      self.writer.resetState();
      dialog.showError(error);
    })
    .finally(OSWindowProgressService.clear);
  };
});
