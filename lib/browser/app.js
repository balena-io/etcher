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
var electron = require('electron');
var shell = electron.remote.require('shell');
var dialog = electron.remote.require('./src/dialog');

require('angular-ui-bootstrap');
require('./browser/modules/selection-state');
require('./browser/modules/drive-scanner');
require('./browser/modules/image-writer');
require('./browser/modules/logger');
require('./browser/modules/path');

var app = angular.module('ResinEtcher', [
  'ui.bootstrap',

  // Resin Etcher modules
  'ResinEtcher.path',
  'ResinEtcher.selection-state',
  'ResinEtcher.drive-scanner',
  'ResinEtcher.image-writer',
  'ResinEtcher.logger'
]);

// TrackJS integration
// http://docs.trackjs.com/tracker/framework-integrations
app.config(function($provide) {
  'use strict';

  $provide.decorator('$exceptionHandler', function($delegate, $window) {
    return function(exception, cause) {
      $window.trackJs.track(exception);
      $delegate(exception, cause);
    };
  });

  $provide.decorator('$log', function($delegate, $window) {

    // Save the original $log.debug()
    var debugFn = $delegate.debug;

    $delegate.debug = function(message) {
      $window.trackJs.console.debug(message);
      debugFn.call(null, message);
    };

    return $delegate;
  });
});

app.controller('AppController', function($q, DriveScannerService, SelectionStateService, ImageWriterService, LoggerService) {
  'use strict';

  var self = this;
  this.selection = SelectionStateService;
  this.writer = ImageWriterService;
  this.scanner = DriveScannerService;

  this.restart = function(options) {
    LoggerService.debug('Restarting');
    this.selection.clear(options);
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
          LoggerService.debug('Autoselecting drive: ' + drive.device);
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
      LoggerService.debug('Image selected: ' + image);
    });
  };

  this.selectDrive = function(drive) {
    self.selection.setDrive(drive);
    LoggerService.debug('Drive selected: ' + drive.device);
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

    LoggerService.debug('Reselecting image');
  };

  this.reselectDrive = function() {
    if (self.writer.isBurning()) {
      return;
    }

    self.selection.removeDrive();
    LoggerService.debug('Reselecting drive');
  };

  this.burn = function(image, drive) {

    // Stop scanning drives when burning
    // otherwise Windows throws EPERM
    self.scanner.stop();

    LoggerService.debug('Burning ' + image + ' to ' + drive.device);
    return self.writer.burn(image, drive).then(function() {
      LoggerService.debug('Done!');
    }).catch(dialog.showError);
  };

  this.open = shell.openExternal;
});
