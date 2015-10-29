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
 * @module herostratus.drive-scanner
 */

var angular = require('angular');
var _ = require('lodash');
var remote = window.require('remote');

if (window.mocha) {
  var drives = remote.require(require('path').join(__dirname, '..', '..', 'src', 'drives'));
} else {
  var drives = remote.require('./src/drives');
}

var driveScanner = angular.module('herostratus.drive-scanner', []);

driveScanner.service('DriveScannerRefreshService', function($interval) {
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
		fn();
		interval = $interval(fn, ms);
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
    return $q.when(drives.listRemovable());
  };

  /**
   * @summary Scan drives and populate `.drives`
   * @function
   * @public
   *
   * @param {Number} ms - interval milliseconds
   *
   * @example
   * DriveScannerService.start(2000);
   */
  this.start = function(ms) {
    DriveScannerRefreshService.every(function() {
      return self.scan().then(self.setDrives);
    }, ms);
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
