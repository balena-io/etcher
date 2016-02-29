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
require('./browser/modules/selection-state');
require('./browser/modules/drive-scanner');
require('./browser/modules/image-writer');
require('./browser/modules/path');
require('./browser/modules/analytics');

const app = angular.module('Etcher', [
  'ui.bootstrap',

  // Etcher modules
  'Etcher.path',
  'Etcher.selection-state',
  'Etcher.drive-scanner',
  'Etcher.image-writer',
  'Etcher.analytics'
]);

app.controller('AppController', function($q, DriveScannerService, SelectionStateService, ImageWriterService, AnalyticsService) {
  let self = this;
  this.selection = SelectionStateService;
  this.writer = ImageWriterService;
  this.scanner = DriveScannerService;

  this.restart = function(options) {
    AnalyticsService.logEvent('Restart');
    this.selection.clear(options);

    self.state = {
      progress: 0,
      percentage: 0
    };

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
  };

  this.restart();

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

    return self.writer.burn(image, drive, function(state) {
      self.state = state;
      AnalyticsService.log(`Progress: ${self.state.progress}% at ${self.state.speed} MB/s`);

      // Show progress inline in operating system task bar
      currentWindow.setProgressBar(self.state.progress / 100);

    }).then(function() {
      AnalyticsService.logEvent('Done');
    }).catch(dialog.showError).finally(function() {

      // Remove progress bar from task bar
      // Passing 0 or null/undefined doesn't do
      // the trick for Electron for some reason.
      currentWindow.setProgressBar(-1);

    });
  };

  this.open = shell.openExternal;
});
