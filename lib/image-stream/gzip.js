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

'use strict'

/**
 * @summary The byte length of ISIZE
 * @type {Number}
 * @constant
 * @description
 * See https://tools.ietf.org/html/rfc1952
 */
const ISIZE_LENGTH = 4

/**
 * @summary Get the estimated uncompressed size of a gzip file
 * @function
 * @public
 *
 * @description
 * This function determines the uncompressed size of the gzip file
 * by reading its `ISIZE` field at the end of the file. The specification
 * clarifies that this value is just an estimation.
 *
 * @param {Object} options - options
 * @param {Number} options.size - file size
 * @param {Function} options.read - read function (position, count)
 * @fulfil {Number} - uncompressed size
 * @returns {Promise}
 *
 * @example
 * const fd = fs.openSync('path/to/image', 'r');
 *
 * gzip.getUncompressedSize({
 *   size: fs.statSync('path/to/image.gz').size,
 *   read: (position, count) => {
 *     const buffer = Buffer.alloc(count);
 *     return new Promise((resolve, reject) => {
 *       fs.read(fd, buffer, 0, count, position, (error) => {
 *         if (error) {
 *           return reject(error);
 *         }
 *
 *         resolve(buffer);
 *       });
 *     });
 *   }
 * }).then((uncompressedSize) => {
 *   console.log(`The uncompressed size is: ${uncompressedSize}`);
 *   fs.closeSync(fd);
 * });
 */
exports.getUncompressedSize = (options) => {
  const ISIZE_BUFFER_START = 0
  const ISIZE_POSITION = options.size - ISIZE_LENGTH
  return options.read(ISIZE_POSITION, ISIZE_LENGTH).then((buffer) => {
    return buffer.readUInt32LE(ISIZE_BUFFER_START)
  })
}
