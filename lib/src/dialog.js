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

const electron = require('electron');
const Bluebird = require('bluebird');
const zipImage = require('resin-zip-image');
const packageJSON = require('../../package.json');

/**
 * @summary Open an image selection dialog
 * @function
 * @public
 *
 * @description
 * Notice that by image, we mean *.img/*.iso/*.zip files.
 *
 * If the user selects an invalid zip image, an error alert
 * is shown, and the promise resolves `undefined`.
 *
 * @fulfil {String} - selected image
 * @returns {Promise};
 *
 * @example
 * dialog.selectImage().then(function(image) {
 *   console.log('The selected image is', image);
 * });
 */
exports.selectImage = function() {
  return new Bluebird(function(resolve) {
    electron.dialog.showOpenDialog({
      properties: [ 'openFile' ],
      filters: [
        {
          name: 'IMG/ISO/ZIP',
          extensions: [
            'zip',
            'img',
            'iso'
          ]
        }
      ]
    }, function(files) {
      return resolve(files || []);
    });
  }).get(0).then(function(file) {
    if (file && zipImage.isZip(file) && !zipImage.isValidZipImage(file)) {
      electron.dialog.showErrorBox(
        'Invalid zip image',
        `${packageJSON.displayName} can only open Zip archives that contain exactly one image file inside.`
      );

      return;
    }

    return file;
  });
};

/**
 * @summary Show error dialog for an Error instance
 * @function
 * @public
 *
 * @param {Error} error - error
 *
 * @example
 * dialog.showError(new Error('Foo Bar'));
 */
exports.showError = function(error) {
  error = error || {};
  electron.dialog.showErrorBox(error.message || 'An error ocurred!', error.stack || '');
  throw error;
};
