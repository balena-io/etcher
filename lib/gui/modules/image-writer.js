/*
 * Copyright 2016 resin.io
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
 * @module Etcher.Modules.ImageWriter
 */

const angular = require('angular');
const childWriter = require('../../src/child-writer');

const MODULE_NAME = 'Etcher.Modules.ImageWriter';
const imageWriter = angular.module(MODULE_NAME, [
  require('../models/settings'),
  require('../models/selection-state'),
  require('../models/flash-state')
]);

imageWriter.service('ImageWriterService', function($q, $rootScope, SettingsModel, SelectionStateModel, FlashStateModel) {

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
   * @fulfil {Object} - flash results
   * @returns {Promise}
   *
   * @example
   * ImageWriter.performWrite('path/to/image.img', {
   *   device: '/dev/disk2'
   * }, (state) => {
   *   console.log(state.percentage);
   * });
   */
  this.performWrite = (image, drive, onProgress) => {
    return $q((resolve, reject) => {
      const child = childWriter.write(image, drive, {
        validateWriteOnSuccess: SettingsModel.get('validateWriteOnSuccess'),
        unmountOnSuccess: SettingsModel.get('unmountOnSuccess')
      });
      child.on('error', reject);
      child.on('done', resolve);
      child.on('progress', onProgress);
    });
  };

  /**
   * @summary Flash an image to a drive
   * @function
   * @public
   *
   * @description
   * This function will update `ImageWriterService.state` with the current writing state.
   *
   * @param {String} image - image path
   * @param {Object} drive - drive
   * @returns {Promise}
   *
   * @example
   * ImageWriterService.flash('foo.img', {
   *   device: '/dev/disk2'
   * }).then(() => {
   *   console.log('Write completed!');
   * });
   */
  this.flash = (image, drive) => {
    if (FlashStateModel.isFlashing()) {
      return $q.reject(new Error('There is already a flash in progress'));
    }

    FlashStateModel.setFlashingFlag();

    return this.performWrite(image, drive, (state) => {

      // Bring this value to the world of angular.
      // If we don't trigger a digest loop,
      // `.getFlashState()` will not return
      // the latest updated progress state.
      $rootScope.$apply(() => {
        FlashStateModel.setProgressState(state);
      });

    }).then(FlashStateModel.unsetFlashingFlag).catch((error) => {
      FlashStateModel.unsetFlashingFlag({
        errorCode: error.code
      });

      return $q.reject(error);
    });
  };

});

module.exports = MODULE_NAME;
