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
var remote = window.require('remote');
var shell = remote.require('shell');
var dialog = remote.require('./src/dialog');

require('angular-ui-bootstrap');
<<<<<<< HEAD
require('./modules/selection-state');
require('./modules/drive-scanner');
require('./modules/image-writer');
require('./modules/path');
=======
require('./browser/modules/track');
require('./browser/modules/selection-state');
require('./browser/modules/drive-scanner');
require('./browser/modules/image-writer');
require('./browser/modules/path');
>>>>>>> resin-io/master

var app = angular.module('ResinEtcher', [
  'ui.bootstrap',
  'TrackJS',

  // Resin Etcher modules
  'ResinEtcher.path',
  'ResinEtcher.selection-state',
  'ResinEtcher.drive-scanner',
  'ResinEtcher.image-writer'
]);

<<<<<<< HEAD
app.controller('AppController', function($q, DriveScannerService, SelectionStateService, ImageWriterService) {
  'use strict';

  var self = this;
=======
app.controller('AppController', function($q, $log, DriveScannerService, SelectionStateService, ImageWriterService) {
  let self = this;
>>>>>>> resin-io/master
  this.selection = SelectionStateService;
  this.writer = ImageWriterService;
  this.scanner = DriveScannerService;

  this.restart = function() {
    console.debug('Restarting');
    this.selection.clear();
    this.writer.setProgress(0);
    this.scanner.start(2000);
  };

  this.restart();

  // We're ready to unhide the application now
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
