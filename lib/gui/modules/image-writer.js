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
 * @module Etcher.image-writer
 */

const angular = require('angular');
const Store = require('../models/store');
const childWriter = require('../../src/child-writer');

const MODULE_NAME = 'Etcher.image-writer';
const imageWriter = angular.module(MODULE_NAME, [
  require('../models/settings'),
  require('../utils/notifier/notifier')
]);

imageWriter.service('ImageWriterService', function($q, $timeout, SettingsModel, NotifierService) {
  let self = this;

  /**
   * @summary Reset flash state
   * @function
   * @public
   *
   * @example
   * ImageWriterService.resetState();
   */
  this.resetState = function() {
    Store.dispatch({
      type: Store.Actions.RESET_FLASH_STATE
    });
  };

  /**
   * @summary Flash progress state
   * @type Object
   * @public
   */
  this.state = {
    progress: 0,
    speed: 0
  };

  Store.subscribe(function() {

    // Safely bring the state to the world of Angular
    $timeout(function() {
      self.state = Store.getState().toJS().flashState;
    });

  });

  /**
   * @summary Check if currently flashing
   * @function
   * @private
   *
   * @returns {Boolean} whether is flashing or not
   *
   * @example
   * if (ImageWriterService.isFlashing()) {
   *   console.log('We\'re currently flashing');
   * }
   */
  this.isFlashing = function() {
    return Store.getState().toJS().isFlashing;
  };

  /**
   * @summary Set the flashing status
   * @function
   * @private
   *
   * @description
   * This function is extracted for testing purposes.
   *
   * @param {Boolean} status - flashing status
   *
   * @example
   * ImageWriterService.setFlashing(true);
   */
  this.setFlashing = function(status) {
    if (Boolean(status)) {
      Store.dispatch({
        type: Store.Actions.SET_FLASHING_FLAG
      });
    } else {
      Store.dispatch({
        type: Store.Actions.UNSET_FLASHING_FLAG
      });
    }
  };

  /**
   * @summary Set the flashing state
   * @function
   * @private
   *
   * @description
   * This function is extracted for testing purposes.
   *
   * @param {Object} state - flashing state
   *
   * @example
   * ImageWriterService.setProgressState({
   *   type: 'write',
   *   percentage: 50,
   *   eta: 15,
   *   speed: 100000000000
   * });
   */
  this.setProgressState = function(state) {
    Store.dispatch({
      type: Store.Actions.SET_FLASH_STATE,
      data: {
        type: state.type,
        progress: state.percentage,
        eta: state.eta,

        // Transform bytes to megabytes preserving only two decimal places
        speed: Math.floor(state.speed / 1e+6 * 100) / 100 || 0
      }
    });

    NotifierService.emit('image-writer:state', self.state);
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
   * @fulfil {Object} - flash results
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
    return $q(function(resolve, reject) {
      const child = childWriter.write(image, drive, SettingsModel.data);
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
   *
   * @fulfil {Object} flash results
   * @returns {Promise}
   *
   * @example
   * ImageWriterService.flash('foo.img', {
   *   device: '/dev/disk2'
   * }).then(function() {
   *   console.log('Write completed!');
   * });
   */
  this.flash = function(image, drive) {
    if (self.isFlashing()) {
      return $q.reject(new Error('There is already a flash in progress'));
    }

    self.setFlashing(true);

    return self.performWrite(image, drive, self.setProgressState).finally(function() {
      self.setFlashing(false);
    });
  };

});

module.exports = MODULE_NAME;
