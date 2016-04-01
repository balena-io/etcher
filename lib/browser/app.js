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

require('angular-ui-bootstrap');
require('angular-ui-router');
require('./browser/models/selection-state');
require('./browser/modules/drive-scanner');
require('./browser/modules/image-writer');
require('./browser/modules/path');
require('./browser/modules/notifier');
require('./browser/modules/analytics');
require('./browser/components/progress-button/progress-button');
require('./browser/components/drive-selector');
require('./browser/pages/finish/finish');
require('./browser/pages/settings/settings');
require('./browser/utils/window-progress/window-progress');
require('./browser/utils/open-external/open-external');
require('./browser/utils/if-state/if-state');

const app = angular.module('Etcher', [
  'ui.router',
  'ui.bootstrap',

  // Etcher modules
  'Etcher.path',
  'Etcher.drive-scanner',
  'Etcher.image-writer',
  'Etcher.notifier',
  'Etcher.analytics',

  // Models
  'Etcher.Models.SelectionState',

  // Components
  'Etcher.Components.ProgressButton',
  'Etcher.Components.DriveSelector',

  // Pages
  'Etcher.Pages.Finish',
  'Etcher.Pages.Settings',

  // Utils
  'Etcher.Utils.WindowProgress',
  'Etcher.Utils.OpenExternal',
  'Etcher.Utils.IfState'
]);

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
  ImageWriterService,
  AnalyticsService,
  DriveSelectorService,
  WindowProgressService
) {
  let self = this;
  this.selection = SelectionStateModel;
  this.writer = ImageWriterService;
  this.scanner = DriveScannerService;

  // This catches the case where the user enters
  // the settings screen when a burn finished
  // and goes back to the main screen with the back button.
  if (!this.writer.isBurning()) {

    this.selection.clear({

      // Preserve image, in case there is one, otherwise
      // we revert the behaviour of "Use same image".
      preserveImage: true

    });

    this.writer.resetState();
  }

  NotifierService.subscribe($scope, 'image-writer:state', function(state) {
    AnalyticsService.log(`Progress: ${state.progress}% at ${state.speed} MB/s`);
    WindowProgressService.set(state.progress);
  });

  this.scanner.start(2000).on('error', dialog.showError).on('scan', function(drives) {

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

  this.selectImage = function() {
    return $q.when(dialog.selectImage()).then(function(image) {

      // Avoid analytics and selection state changes
      // if no file was resolved from the dialog.
      if (!image) {
        return;
      }

      self.selection.setImage(image);
      AnalyticsService.logEvent('Select image', {
        image: image
      });
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
    if (self.writer.isBurning()) {
      return;
    }

    // Reselecting an image automatically
    // de-selects the current drive, if any.
    // This is made so the user effectively
    // "returns" to the first step.
    self.selection.clear();

    AnalyticsService.logEvent('Reselect image');
  };

  this.reselectDrive = function() {
    if (self.writer.isBurning()) {
      return;
    }

    self.selection.removeDrive();
    AnalyticsService.logEvent('Reselect drive');
  };

  this.burn = function(image, drive) {

    // Stop scanning drives when burning
    // otherwise Windows throws EPERM
    self.scanner.stop();

    AnalyticsService.logEvent('Burn', {
      image: image,
      device: drive.device
    });

    return self.writer.burn(image, drive).then(function() {
      AnalyticsService.logEvent('Done');
      $state.go('success');
    })
    .catch(dialog.showError)
    .finally(WindowProgressService.clear);
  };
});
