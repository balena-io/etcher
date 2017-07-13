/*
 * Copyright 2017 resin.io
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
const Bluebird = require('bluebird');
const fileType = require('file-type');
const mime = require('mime-types');
const fs = require('fs');

/**
 * @summary The default MIME type
 * @type {String}
 * @constant
 */
exports.DEFAULT_MIME_TYPE = 'application/octet-stream';

/**
 * @summary Get file's mime type, by reading the initial 262 bytes if necessary
 * @function
 * @public
 *
 * @param {String} filename - file path
 * @fulfil {String} - mime type
 * @returns {Promise}
 *
 * @example
 * mime.getMimeTypeFromFileName('path/to/raspberrypi.img.gz').then((mimeType) => {
 *   console.log(mimeType);
 * });
 */
exports.getMimeTypeFromFileName = (filename) => {
  const mimeType = mime.lookup(filename);

  if (mimeType) {
    return Bluebird.resolve(mimeType);
  }

  const FILE_TYPE_ID_BYTES = 262;

  return Bluebird.using(fs.openAsync(filename, 'r').disposer((fileDescriptor) => {
    return fs.closeAsync(fileDescriptor);
  }), (fileDescriptor) => {
    const BUFFER_START = 0;
    const buffer = Buffer.alloc(FILE_TYPE_ID_BYTES);

    return fs.readAsync(fileDescriptor, buffer, BUFFER_START, FILE_TYPE_ID_BYTES, null).then(() => {
      return _.get(fileType(buffer), [ 'mime' ], exports.DEFAULT_MIME_TYPE);
    });
  });
};
