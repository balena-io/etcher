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
const path = require('path');
const isRunningInAsar = require('electron-is-running-in-asar');
const electron = require('electron');
const childProcess = require('child_process');
const EXIT_CODES = require('../../src/exit-codes');

const MODULE_NAME = 'Etcher.image-writer';
const imageWriter = angular.module(MODULE_NAME, [
  require('../models/settings'),
  require('../modules/analytics'),
  require('../utils/notifier/notifier')
]);

imageWriter.service('ImageWriterService', function($q, $timeout, SettingsModel, NotifierService, AnalyticsService) {
  let self = this;
  let flashing = false;

  /**
   * @summary Reset flash state
   * @function
   * @public
   *
   * @example
   * ImageWriterService.resetState();
   */
  this.resetState = function() {
    self.state = {
      progress: 0,
      speed: 0
    };
  };

  /**
   * @summary Flash progress state
   * @type Object
   * @public
   */
  this.state = {};
  this.resetState();

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
    return flashing;
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
    flashing = Boolean(status);
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
    const argv = [ image ];
    argv.push('--drive', drive.device);

    // Make use of `child_process.fork()` facility to send
    // messages to the parent through an IPC channel.
    // This allows us to receive the progress state by
    // listening to the `message` event of the
    // `ChildProcess` object.
    argv.push('--ipc');

    // Explicitly set the boolen flag in positive
    // or negative way in order to be on the safe
    // side in case the Etcher CLI changes the
    // default value of these options.

    if (SettingsModel.data.unmountOnSuccess) {
      argv.push('--unmount');
    } else {
      argv.push('--no-unmount');
    }

    if (SettingsModel.data.validateWriteOnSuccess) {
      argv.push('--check');
    } else {
      argv.push('--no-check');
    }

    return $q(function(resolve, reject) {

      let executable;

      if (isRunningInAsar()) {
        executable = path.join(process.resourcesPath, 'app.asar');
      } else {
        executable = electron.remote.process.argv[1];
      }

      AnalyticsService.log(`Forking: ${executable} ${argv.join(' ')}`);
      const child = childProcess.fork(executable, argv, {

        // Pipe stdout/stderr to the parent
        // We're not using it directly but its
        // handy for debugging reasons.
        silent: true

      });

      child.on('message', function(message) {
        switch (message.command) {
          case 'progress': {
            onProgress(message.data);
            break;
          }

          case 'done': {
            resolve(message.data);
            break;
          }

          case 'error': {
            reject(message.data);
            break;
          }
        }
      });

      child.on('error', reject);

      child.on('close', function(code) {
        if (code !== EXIT_CODES.SUCCESS && code !== EXIT_CODES.VALIDATION_ERROR) {
          return reject(new Error(`Child process exitted with error code: ${code}`));
        }
      });
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

    return self.performWrite(image, drive, function(state) {

      // Safely bring the state to the world of Angular
      $timeout(function() {

        self.state = {
          type: state.type,
          progress: state.percentage,

          // Transform bytes to megabytes preserving only two decimal places
          speed: Math.floor(state.speed / 1e+6 * 100) / 100 || 0
        };

        NotifierService.emit('image-writer:state', self.state);
      });

    }).finally(function() {
      self.setFlashing(false);
    });
  };

});

module.exports = MODULE_NAME;
