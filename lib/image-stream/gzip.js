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

const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));

/**
 * @summary The byte length of ISIZE
 * @type {Number}
 * @constant
 * @description
 * See https://tools.ietf.org/html/rfc1952
 */
const ISIZE_LENGTH = 4;

/**
 * @summary Get a gzip file uncompressed size
 * @function
 * @public
 *
 * @description
 * This function determines the uncompressed size of the gzip file
 * by reading its `ISIZE`. The specification clarifies that this
 * value is just an estimation.
 *
 * @param {String} file - path to gzip file
 * @fulfil {Number} - uncompressed size
 * @returns {Promise}
 *
 * @example
 * gzip.getUncompressedSize('path/to/file.gz').then((uncompressedSize) => {
 *   console.log(`The uncompressed size is: ${uncompressedSize}`);
 * });
 */
exports.getUncompressedSize = (file) => {
  return Bluebird.using(fs.openAsync(file, 'r').disposer((fileDescriptor) => {
    return fs.closeAsync(fileDescriptor);
  }), (fileDescriptor) => {
    return fs.fstatAsync(fileDescriptor).then((stats) => {
      const ISIZE_BUFFER_FILL_VALUE = 0;
      const ISIZE_BUFFER_START = 0;
      const isizeBuffer = Buffer.alloc(ISIZE_LENGTH, ISIZE_BUFFER_FILL_VALUE);

      return fs.readAsync(
        fileDescriptor,
        isizeBuffer,
        ISIZE_BUFFER_START,
        ISIZE_LENGTH,
        stats.size - ISIZE_LENGTH
      ).then((bytesRead) => {
        if (bytesRead !== ISIZE_LENGTH) {
          throw new Error(`Bytes read mismatch: ${bytesRead} != ${ISIZE_LENGTH}`);
        }

        return isizeBuffer.readUInt32LE(ISIZE_BUFFER_START);
      });
    });
  });
};
