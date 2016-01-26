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
 * @module ResinEtcher.image-writer
 */

const angular = require('angular');
const electron = require('electron');

if (window.mocha) {
  var writer = electron.remote.require(require('path').join(__dirname, '..', '..', 'src', 'writer'));
} else {
  var writer = electron.remote.require('./src/writer');
}

const imageWriter = angular.module('ResinEtcher.image-writer', []);

imageWriter.service('ImageWriterService', function($q, $timeout) {
  let self = this;
  let burning = false;

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
   * @description
   * This function is extracted for testing purposes.
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
  this.burn = function(image, drive, onProgress) {
    if (self.isBurning()) {
      return $q.reject(new Error('There is already a burn in progress'));
    }

    self.setBurning(true);

    return self.performWrite(image, drive, function(state) {

      // Safely bring the state to the world of Angular
      $timeout(function() {

        return onProgress({
          progress: Math.floor(state.percentage),

          // Transform bytes to megabytes preserving only two decimal places
          speed: Math.floor(state.speed / 1e+6 * 100) / 100 || 0

        });
      });

    }).finally(function() {
      self.setBurning(false);
    });
  };

});
