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
 * @module ResinEtcher
 */

'use strict';

var angular = require('angular');
const _ = require('lodash');
const electron = require('electron');
const shell = electron.remote.require('shell');
const dialog = electron.remote.require('./src/dialog');

require('angular-ui-bootstrap');
require('./browser/modules/track');
require('./browser/modules/selection-state');
require('./browser/modules/drive-scanner');
require('./browser/modules/image-writer');
require('./browser/modules/path');

const app = angular.module('ResinEtcher', [
  'ui.bootstrap',
  'TrackJS',

  // Resin Etcher modules
  'ResinEtcher.path',
  'ResinEtcher.selection-state',
  'ResinEtcher.drive-scanner',
  'ResinEtcher.image-writer'
]);

app.controller('AppController', function($q, $log, DriveScannerService, SelectionStateService, ImageWriterService) {
  let self = this;
  this.selection = SelectionStateService;
  this.writer = ImageWriterService;
  this.scanner = DriveScannerService;

  this.restart = function(options) {
    $log.debug('Restarting');
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
          $log.debug(`Autoselecting drive: ${drive.device}`);
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
      $log.debug(`Image selected: ${image}`);
    });
  };

  this.selectDrive = function(drive) {
    self.selection.setDrive(drive);
    $log.debug(`Drive selected: ${drive.device}`);
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

    $log.debug('Reselecting image');
  };

  this.reselectDrive = function() {
    if (self.writer.isBurning()) {
      return;
    }

    self.selection.removeDrive();
    $log.debug('Reselecting drive');
  };

  this.burn = function(image, drive) {

    // Stop scanning drives when burning
    // otherwise Windows throws EPERM
    self.scanner.stop();

    $log.debug(`Burning ${image} to ${drive.device}`);
    return self.writer.burn(image, drive, function(state) {
      self.state = state;
      $log.debug(`Progress: ${self.state.progress}% at ${self.state.speed} MB/s`);
    }).then(function() {
      $log.debug('Done!');
    }).catch(dialog.showError);
  };

  this.open = shell.openExternal;
});
