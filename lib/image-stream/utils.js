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
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const archiveType = require('archive-type');

/**
 * @summary Get archive mime type
 * @function
 * @public
 *
 * @param {String} file - file path
 * @fulfil {String} - mime type
 * @returns {Promise}
 *
 * @example
 * utils.getArchiveMimeType('path/to/raspberrypi.img.gz').then((mimeType) => {
 *   console.log(mimeType);
 * });
 */
exports.getArchiveMimeType = (file) => {

  // `archive-type` only needs the first 261 bytes
  // See https://github.com/kevva/archive-type
  const ARCHIVE_TYPE_IDENTIFICATION_BYTES_LENGTH = 261;

  return Bluebird.using(fs.openAsync(file, 'r').disposer((fileDescriptor) => {
    return fs.closeAsync(fileDescriptor);
  }), (fileDescriptor) => {
    const BUFFER_START = 0;
    const chunk = new Buffer(ARCHIVE_TYPE_IDENTIFICATION_BYTES_LENGTH);

    return fs.readAsync(
      fileDescriptor,
      chunk,
      BUFFER_START,
      ARCHIVE_TYPE_IDENTIFICATION_BYTES_LENGTH,
      null
    ).then(() => {
      return _.get(archiveType(chunk), [ 'mime' ], 'application/octet-stream');
    });
  });
};

/**
 * @summary Extract the data of a readable stream
 * @function
 * @public
 *
 * @description
 * You should be careful when using this function, since you can only
 * extract files that are not bigger than the available computer memory.
 *
 * @param {StreamReadable} stream - stream
 * @fulfil {Buffer} - data
 * @returns {Promise}
 *
 * @example
 * const stream = fs.createReadStream('./foo/bar');
 *
 * utils.extractStream(stream).then((data) => {
 *   console.log(data.toString());
 * });
 */
exports.extractStream = (stream) => {
  return new Bluebird((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    stream.on('error', reject);
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
};
