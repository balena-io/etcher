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

'use strict';

/**
 * @module Etcher.drive-scanner
 */

const angular = require('angular');
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const drivelist = require('drivelist');

const driveScanner = angular.module('Etcher.drive-scanner', []);

driveScanner.service('DriveScannerService', function($q, $interval, $timeout) {
  let self = this;
  let interval = null;

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
    var deferred = $q.defer();

    drivelist.list(function(error, drives) {
      if (error) {
        return deferred.reject(error);
      }

      return deferred.resolve(_.filter(drives, function(drive) {
        return !drive.system;
      }));
    });

    return deferred.promise;
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
   * const emitter = DriveScannerService.start(2000);
   *
   * emitter.on('scan', function(drives) {
   *   console.log(drives);
   * });
   */
  this.start = function(ms) {
    let emitter = new EventEmitter();

    const fn = function() {
      return self.scan().then(function(drives) {
        emitter.emit('scan', drives);
        self.setDrives(drives);
      }).catch(function(error) {
        emitter.emit('error', error);
      });
    };

    // Make sure any pending interval is cancelled
    // to avoid potential memory leaks.
    self.stop();

    // Call fn after in the next process tick
    // to be able to capture the first run
    // in unit tests.
    $timeout(function() {
      fn();
      interval = $interval(fn, ms);
    });

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
  this.stop = function() {
    $interval.cancel(interval);
  };

});
