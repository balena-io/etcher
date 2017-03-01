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
const readChunk = require('read-chunk');
const archiveType = require('archive-type');

/**
 * @summary Get archive mime type
 * @function
 * @public
 *
 * @param {String} file - file path
 * @returns {String} mime type
 *
 * @example
 * utils.getArchiveMimeType('path/to/raspberrypi.img.gz');
 */
exports.getArchiveMimeType = (file) => {

  // `archive-type` only needs the first 261 bytes
  // See https://github.com/kevva/archive-type
  const MAGIC_NUMBER_BUFFER_START = 0;
  const MAGIC_NUMBER_BUFFER_END = 261;
  const chunk = readChunk.sync(file, MAGIC_NUMBER_BUFFER_START, MAGIC_NUMBER_BUFFER_END);

  return _.get(archiveType(chunk), 'mime', 'application/octet-stream');
};
