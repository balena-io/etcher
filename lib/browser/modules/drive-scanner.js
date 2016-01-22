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
 * @module ResinEtcher.drive-scanner
 */

var angular = require('angular');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var electron = require('electron');

if (window.mocha) {
  var path = require('path');
  var srcPath = path.join(__dirname, '..', '..', 'src');
  var drives = electron.remote.require(path.join(srcPath, 'drives'));
  var dialog = electron.remote.require(path.join(srcPath, 'dialog'));
} else {
  var drives = electron.remote.require('./src/drives');
  var dialog = electron.remote.require('./src/dialog');
}

var driveScanner = angular.module('ResinEtcher.drive-scanner', []);

driveScanner.service('DriveScannerRefreshService', function($interval, $timeout) {
  'use strict';

  var interval = null;

  /**
   * @summary Run a function every certain milliseconds
   * @function
   * @public
   *
   * @param {Function} fn - function
   * @param {Number} ms - interval milliseconds
   *
   * @example
   * DriveScannerRefreshService.every(function() {
   *   console.log('I get printed every 2 seconds!');
   * }, 2000);
   */
  this.every = function(fn, ms) {

    // Call fn after in the next process tick
    // to be able to capture the first run
    // in unit tests.
    $timeout(function() {
      fn();
      interval = $interval(fn, ms);
    });

  };

  /**
   * @summary Stop the runnning interval
   * @function
   * @public
   *
   * @example
   * DriveScannerRefreshService.stop();
   */
  this.stop = function() {
    $interval.cancel(interval);
  };

});

driveScanner.service('DriveScannerService', function($q, DriveScannerRefreshService) {
  'use strict';

  var self = this;

  /**
   * @summary List of available drives
   * @type {Object[]}
   * @public
   */
  this.drives = [];

  /**
   * @summary Check if there are available drives
   * @function
   * @public
   *
   * @returns {Boolean} whether there are available drives
   *
   * @example
   * if (DriveScannerService.hasAvailableDrives()) {
   *   console.log('There are available drives!');
   * }
   */
  this.hasAvailableDrives = function() {
    return !_.isEmpty(self.drives);
  };

  /**
   * @summary Set the list of drives
   * @function
   * @public
   *
   * @param {Object[]} drives - drives
   *
   * @example
   * DriveScannerService.scan().then(function(drives) {
   *   DriveScannerService.setDrives(drives);
   * });
   */
  this.setDrives = function(drives) {

    // Only update if something has changed
    // to avoid unnecessary DOM manipulations
    // angular.equals ignores $$hashKey by default
    if (!angular.equals(self.drives, drives)) {
      self.drives = drives;
    }
  };

  /**
   * @summary Get available drives
   * @function
   * @public
   *
   * @fulfil {Object[]} - drives
   * @returns {Promise}
   *
   * @example
   * DriveScannerService.scan().then(function(drives) {
   *   console.log(drives);
   * });
   */
  this.scan = function() {
    return $q.when(drives.listRemovable()).catch(dialog.showError);
  };

  /**
   * @summary Scan drives and populate `.drives`
   * @function
   * @public
   *
   * @description
   * This function returns an event emitter instance
   * that emits a `scan` event everything it scans
   * the drives successfully.
   *
   * @param {Number} ms - interval milliseconds
   * @returns {EventEmitter} event emitter instance
   *
   * @example
   * var emitter = DriveScannerService.start(2000);
   *
   * emitter.on('scan', function(drives) {
   *   console.log(drives);
   * });
   */
  this.start = function(ms) {
    var emitter = new EventEmitter();

    DriveScannerRefreshService.every(function() {
      return self.scan().then(function(drives) {
        emitter.emit('scan', drives);
        self.setDrives(drives);
      });
    }, ms);

    return emitter;
  };

  /**
   * @summary Stop scanning drives
   * @function
   * @public
   *
   * @example
   * DriveScannerService.stop();
   */
  this.stop = DriveScannerRefreshService.stop;

});
