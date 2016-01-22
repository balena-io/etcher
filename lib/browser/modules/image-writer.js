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
 * @module ResinEtcher.image-writer
 */

var angular = require('angular');
var electron = require('electron');

if (window.mocha) {
  var writer = electron.remote.require(require('path').join(__dirname, '..', '..', 'src', 'writer'));
} else {
  var writer = electron.remote.require('./src/writer');
}

var imageWriter = angular.module('ResinEtcher.image-writer', []);

imageWriter.service('ImageWriterService', function($q, $timeout, $log) {
  'use strict';

  var self = this;
  var burning = false;

  /*
   * @summary Progress state
   * @type Object
   * @public
   */
  this.state = {

    /**
     * @summary Progress percentage
     * @type Number
     * @public
     */
    progress: 0,

    /**
     * @summary Progress speed
     * @type Number
     * @public
     */
    speed: 0

  };

  /**
   * @summary Set progress state
   * @function
   * @private
   *
   * @param {Object} state - progress state
   * @param {Number} state.percentage - progress percentage
   *
   * @example
   * ImageWriterService.setProgressState({
   *   percentage: 50
   * });
   */
  this.setProgressState = function(state) {

    // Safely bring the state to the world of Angular
    $timeout(function() {
      self.state.progress = Math.floor(state.percentage);

      // Transform bytes to megabytes preserving only two decimal places
      self.state.speed = Math.floor(state.speed / 1e+6 * 100) / 100 || 0;

      $log.debug('Progress: ' + self.state.progress + '% at ' + self.state.speed + ' MB/s');
    });

  };

  /**
   * @summary Reset progress state
   * @function
   * @public
   *
   * @example
   * ImageWriterService.reset();
   */
  this.reset = function() {
    self.setProgressState({
      percentage: 0,
      speed: 0
    });
  };

  /**
   * @summary Check if currently burning
   * @function
   * @private
   *
   * @returns {Boolean} whether is burning or not
   *
   * @example
   * if (ImageWriterService.isBurning()) {
   *   console.log('We\'re currently burning');
   * }
   */
  this.isBurning = function() {
    return burning;
  };

  /**
   * @summary Set the burning status
   * @function
   * @private
   *
   * @param {Boolean} status - burning status
   *
   * @example
   * ImageWriterService.setBurning(true);
   */
  this.setBurning = function(status) {
    burning = Boolean(status);
  };

  /**
   * @summary Perform write operation
   * @function
   * @private
   *
   * @description
   * This function is extracted for testing purposes.
   *
   * @param {String} image - image path
   * @param {Object} drive - drive
   * @param {Function} onProgress - in progress callback (state)
   *
   * @returns {Promise}
   *
   * @example
   * ImageWriter.performWrite('path/to/image.img', {
   *   device: '/dev/disk2'
   * }, function(state) {
   *   console.log(state.percentage);
   * });
   */
  this.performWrite = function(image, drive, onProgress) {
    return $q.when(writer.writeImage(image, drive, onProgress));
  };

  /**
   * @summary Burn an image to a drive
   * @function
   * @public
   *
   * @description
   * This function will update `state.progress` with the current writing percentage.
   *
   * @param {String} image - image path
   * @param {Object} drive - drive
   *
   * @returns {Promise}
   *
   * @example
   * ImageWriterService.burn('foo.img', {
   *   device: '/dev/disk2'
   * }).then(function() {
   *   console.log('Write completed!');
   * });
   */
  this.burn = function(image, drive) {

    // Avoid writing more than once
    if (self.isBurning()) {
      return;
    }

    self.setBurning(true);

    return self.performWrite(image, drive, self.setProgressState).finally(function() {
      self.setBurning(false);
    });
  };

});
