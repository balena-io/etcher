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

var angular = require('angular');
var _ = require('lodash');
var remote = window.require('remote');
var shell = remote.require('shell');
var dialog = remote.require('./src/dialog');

require('angular-ui-bootstrap');
require('./modules/selection-state');
require('./modules/drive-scanner');
require('./modules/image-writer');
require('./modules/path');

var app = angular.module('ResinEtcher', [
  'ui.bootstrap',

  // Resin Etcher modules
  'ResinEtcher.path',
  'ResinEtcher.selection-state',
  'ResinEtcher.drive-scanner',
  'ResinEtcher.image-writer'
]);

app.controller('AppController', function($q, DriveScannerService, SelectionStateService, ImageWriterService) {
  'use strict';

  var self = this;
  this.selection = SelectionStateService;
  this.writer = ImageWriterService;
  this.scanner = DriveScannerService;

  this.restart = function() {
    console.debug('Restarting');
    this.selection.clear();
    this.writer.reset();
    this.scanner.start(2000).on('scan', function(drives) {

      // Notice we only autoselect the drive if there is an image,
      // which means that the first step was completed successfully,
      // otherwise the drive is selected while the drive step is disabled
      // which looks very weird.
      if (drives.length === 1 && self.selection.hasImage()) {
        var drive = _.first(drives);

        // Do not autoselect the same drive over and over again
        // and fill the logs unnecessary.
        // `angular.equals` is used instead of `_.isEqual` to
        // cope with `$$hashKey`.
        if (!angular.equals(self.selection.getDrive(), drive)) {
          console.debug('Autoselecting drive: ' + drive.device);
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
      console.debug('Image selected: ' + image);
    });
  };

  this.selectDrive = function(drive) {
    self.selection.setDrive(drive);
    console.debug('Drive selected: ' + drive.device);
  };

  this.burn = function(image, drive) {

    // Stop scanning drives when burning
    // otherwise Windows throws EPERM
    self.scanner.stop();

    console.debug('Burning ' + image + ' to ' + drive.device);
    return self.writer.burn(image, drive).then(function() {
      console.debug('Done!');
    }).catch(dialog.showError);
  };

  this.open = shell.openExternal;
});
