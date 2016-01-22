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

var electron = require('electron');
var Promise = require('bluebird');
var _ = require('lodash');

/**
 * @summary Open an image selection dialog
 * @function
 * @public
 *
 * @description
 * Notice that by image, we mean *.img/*.iso files.
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
  'use strict';

  return new Promise(function(resolve, reject) {
    electron.dialog.showOpenDialog({
      properties: [ 'openFile' ],
      filters: [
        { name: 'IMG/ISO', extensions: [ 'img', 'iso' ] }
      ]
    }, function(file) {
      return resolve(_.first(file));
    });
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
  'use strict';

  electron.dialog.showErrorBox(error.message, error.stack || '');
};
