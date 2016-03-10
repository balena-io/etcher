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
const shell = electron.remote.require('shell');
const dialog = electron.remote.require('./src/dialog');
const BrowserWindow = electron.remote.BrowserWindow;
const currentWindow = BrowserWindow.fromId(1);

require('angular-ui-bootstrap');
require('angular-ui-router');
require('./browser/modules/selection-state');
require('./browser/modules/settings');
require('./browser/modules/drive-scanner');
require('./browser/modules/image-writer');
require('./browser/modules/path');
require('./browser/modules/notifier');
require('./browser/modules/analytics');
require('./browser/controllers/finish');

const app = angular.module('Etcher', [
  'ui.router',
  'ui.bootstrap',

  // Etcher modules
  'Etcher.path',
  'Etcher.selection-state',
  'Etcher.settings',
  'Etcher.drive-scanner',
  'Etcher.image-writer',
  'Etcher.notifier',
  'Etcher.analytics',

  // Controllers
  'Etcher.controllers.finish'
]);

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/main');

  $stateProvider
    .state('main', {
      url: '/main',
      controller: 'AppController as app',
      templateUrl: './partials/main.html'
    })
    .state('success', {
      url: '/success',
      controller: 'FinishController as finish',
      templateUrl: './partials/success.html'
    })
    .state('settings', {
      url: '/settings',
      controller: 'SettingsController as settings',
      templateUrl: './partials/settings.html'
    });
});

app.controller('AppController', function(
  $q,
  $state,
  $scope,
  NotifierService,
  DriveScannerService,
  SelectionStateService,
  ImageWriterService,
  AnalyticsService
) {
  let self = this;
  this.selection = SelectionStateService;
  this.writer = ImageWriterService;
  this.scanner = DriveScannerService;

  NotifierService.subscribe($scope, 'image-writer:state', function(state) {
    AnalyticsService.log(`Progress: ${state.progress}% at ${state.speed} MB/s`);

    // Show progress inline in operating system task bar
    currentWindow.setProgressBar(state.progress / 100);
  });

  this.scanner.start(2000).on('scan', function(drives) {

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
    }).catch(dialog.showError).finally(function() {

      // Remove progress bar from task bar
      // Passing 0 or null/undefined doesn't do
      // the trick for Electron for some reason.
      currentWindow.setProgressBar(-1);

    });
  };
});

app.controller('SettingsController', function(SettingsService) {
  this.storage = SettingsService.data;
});

app.controller('NavigationController', function($state) {
  this.isState = $state.is;
  this.open = shell.openExternal;
});
