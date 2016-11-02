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

const _ = require('lodash');
const imageStream = require('etcher-image-stream');
const electron = require('electron');

module.exports = function($q, SupportedFormatsModel) {

  /**
   * @summary Open an image selection dialog
   * @function
   * @public
   *
   * @description
   * Notice that by image, we mean *.img/*.iso/*.zip/etc files.
   *
   * @fulfil {Object} - selected image
   * @returns {Promise};
   *
   * @example
   * OSDialogService.selectImage().then((image) => {
   *   console.log('The selected image is', image.path);
   * });
   */
  this.selectImage = () => {
    return $q((resolve, reject) => {
      electron.remote.dialog.showOpenDialog({

        // This variable is set when running in GNU/Linux from
        // inside an AppImage, and represents the working directory
        // from where the AppImage was run (which might not be the
        // place where the AppImage is located). `OWD` stands for
        // "Original Working Directory".
        //
        // See: https://github.com/probonopd/AppImageKit/commit/1569d6f8540aa6c2c618dbdb5d6fcbf0003952b7
        defaultPath: process.env.OWD,

        properties: [
          'openFile'
        ],
        filters: [
          {
            name: 'OS Images',
            extensions: SupportedFormatsModel.getAllExtensions()
          }
        ]
      }, (files) => {

        // `_.first` is smart enough to not throw and return `undefined`
        // if we pass it an `undefined` value (e.g: when the selection
        // dialog was cancelled).
        const imagePath = _.first(files);

        if (!imagePath) {
          return resolve();
        }

        imageStream.getImageMetadata(imagePath).then((metadata) => {
          metadata.path = imagePath;
          metadata.size = metadata.estimatedUncompressedSize || metadata.size;
          return resolve(metadata);
        }).catch(reject);
      });
    });
  };

  /**
   * @summary Show error dialog for an Error instance
   * @function
   * @public
   *
   * @param {(Error|String)} error - error
   * @param {String} [description] - error description
   *
   * @example
   * OSDialogService.showError(new Error('Foo Bar'));
   *
   * @example
   * OSDialogService.showError(new Error('Foo Bar'), 'A custom description');
   *
   * @example
   * OSDialogService.showError('Foo Bar', 'An error happened!');
   */
  this.showError = (error, description) => {
    error = error || {};

    // Try to get as most information as possible about the error
    // rather than falling back to generic messages right away.
    const title = _.attempt(() => {
      if (_.isString(error)) {
        return error;
      }

      return error.message || error.code || 'An error ocurred';
    });

    const message = description || error.stack || JSON.stringify(error) || '';

    // Ensure the parameters are strings to prevent the following
    // types of obscure errors:
    //
    //   Error: Could not call remote function ''.
    //   Check that the function signature is correct.
    //   Underlying error:
    //     Error processing argument at index 0, conversion failure
    //
    // This can be thrown if for some reason, either `title` or `message`
    // are not strings.
    electron.remote.dialog.showErrorBox(title.toString(), message.toString());
  };

};
