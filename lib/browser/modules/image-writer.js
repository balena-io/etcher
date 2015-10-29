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
 * @module herostratus.image-writer
 */

var angular = require('angular');
var remote = window.require('remote');

if (window.mocha) {
  var writer = remote.require(require('path').join(__dirname, '..', '..', 'src', 'writer'));
} else {
  var writer = remote.require('./src/writer');
}

var imageWriter = angular.module('herostratus.image-writer', []);

imageWriter.service('ImageWriterService', function($q, $timeout) {
  'use strict';

  var self = this;
  var burning = false;

  /**
   * @summary Progress percentage
   * @type Number
   * @public
   */
  this.progress = 0;

  /**
   * @summary Set progress percentage
   * @function
   * @private
   *
   * @param {Number} progress
   *
   * @example
   * ImageWriterService.setProgress(50);
   */
  this.setProgress = function(progress) {

    // Safely bring the state to the world of Angular
    $timeout(function() {
      self.progress = Math.floor(progress);
      console.debug('Progress: ' + self.progress);
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
    burning = !!status;
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
   * @param {String} drive - drive device
   * @param {Function} onProgress - in progress callback (state)
   *
   * @returns {Promise}
   *
   * @example
   * ImageWriter.performWrite('path/to/image.img', '/dev/disk2', function(state) {
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
   * This function will update `.progress` with the current writing percentage.
   *
   * @param {String} image - image path
   * @param {String} drive - drive device
   *
   * @returns {Promise}
   *
   * @example
   * ImageWriterService.burn('foo.img', '/dev/disk').then(function() {
   *   console.log('Write completed!');
   * });
   */
  this.burn = function(image, drive) {

    // Avoid writing more than once
    if (self.isBurning()) {
      return;
    }

    self.setBurning(true);

    return self.performWrite(image, drive, function(state) {
      self.setProgress(state.percentage);
    }).finally(function() {
      self.setBurning(false);
    });
  };

});
