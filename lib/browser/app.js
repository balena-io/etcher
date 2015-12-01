/* The MIT License
 *
 * Copyright (c) 2015 Resin.io. https://resin.io.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * @module herostratus
 */

var angular = require('angular');
var remote = window.require('remote');
var shell = remote.require('shell');
var dialog = remote.require('./src/dialog');

require('angular-ui-bootstrap');
require('./modules/selection-state');
require('./modules/drive-scanner');
require('./modules/image-writer');
require('./modules/path');

var app = angular.module('Herostratus', [
  'ui.bootstrap',

  // Herostratus modules
  'herostratus.path',
  'herostratus.selection-state',
  'herostratus.drive-scanner',
  'herostratus.image-writer'
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
    this.writer.setProgress(0);
    this.scanner.start(2000);
  };

  this.restart();

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

  this.platform = window.process.platform;

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
