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
