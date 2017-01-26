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

const path = require('path');
const _ = require('lodash');
const PassThroughStream = require('stream').PassThrough;
const supportedFileTypes = require('./supported');

/**
 * @summary Image extensions
 * @constant
 * @private
 * @type {String[]}
 */
const IMAGE_EXTENSIONS = _.reduce(supportedFileTypes, (accumulator, file) => {
  if (file.type === 'image') {
    accumulator.push(file.extension);
  }

  return accumulator;
}, []);

/**
 * @summary Extract image from archive
 * @function
 * @public
 *
 * @param {String} archive - archive path
 * @param {Object} hooks - archive hooks
 * @param {Function} hooks.getEntries - get entries hook
 * @param {Function} hooks.extractFile - extract file hook
 * @fulfil {Object} image metadata
 * @returns {Promise}
 *
 * @example
 * archive.extractImage('path/to/my/archive.zip', {
 *   getEntries: (archive) => {
 *     return [ ..., ..., ... ];
 *   },
 *   extractFile: (archive, entries, file) => {
 *     ...
 *   }
 * }).then((image) => {
 *   image.stream.pipe(image.transform).pipe(...);
 * });
 */
exports.extractImage = (archive, hooks) => {
  return hooks.getEntries(archive).then((entries) => {

    const imageEntries = _.filter(entries, (entry) => {
      const extension = path.extname(entry.name).slice(1);
      return _.includes(IMAGE_EXTENSIONS, extension);
    });

    if (imageEntries.length !== 1) {
      const error = new Error('Invalid archive image');
      error.description = 'The archive image should contain one and only one top image file.';
      throw error;
    }

    const imageEntry = _.first(imageEntries);

    return hooks.extractFile(archive, entries, imageEntry.name).then((imageStream) => {
      return {
        stream: imageStream,
        transform: new PassThroughStream(),
        size: {
          original: imageEntry.size,
          final: {
            estimation: false,
            value: imageEntry.size
          }
        }
      };
    });
  });
};
