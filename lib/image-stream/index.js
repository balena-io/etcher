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
const isStream = require('isstream');
const utils = require('./utils');
const handlers = require('./handlers');
const supportedFileTypes = require('./supported');

/**
 * @summary Get an image stream from a file
 * @function
 * @public
 *
 * @description
 * This function resolves an object containing the following properties:
 *
 * - `Number size`: The input file size.
 *
 * - `ReadableStream stream`: The input file stream.
 *
 * - `TransformStream transform`: A transform stream that performs any
 * needed transformation to get the image out of the source input file
 * (for example, decompression).
 *
 * The purpose of separating the above components is to handle cases like
 * showing a progress bar when you can't know the final uncompressed size.
 *
 * In such case, you can pipe the `stream` through a progress stream using
 * the input file `size`, and apply the `transform` after the progress stream.
 *
 * @param {String} file - file path
 * @fulfil {Object} - image stream details
 * @returns {Promise}
 *
 * @example
 * const imageStream = require('./lib/image-stream');
 *
 * imageStream.getFromFilePath('path/to/rpi.img.xz').then((image) => {
 *   image.stream
 *     .pipe(image.transform)
 *     .pipe(fs.createWriteStream('/dev/disk2'));
 * });
 */
exports.getFromFilePath = (file) => {
  return Bluebird.try(() => {
    const type = utils.getArchiveMimeType(file);

    if (!_.has(handlers, type)) {
      throw new Error('Invalid image');
    }

    return fs.statAsync(file).then((fileStats) => {
      return _.invoke(handlers, type, file, {
        size: fileStats.size
      });
    });
  }).then((image) => {
    return _.omitBy(image, _.isUndefined);
  });
};

/**
 * @summary Get image metadata
 * @function
 * @public
 *
 * @description
 * This function is useful to determine the final size of an image
 * after decompression or any other needed transformation, as well as
 * other relevant metadata, if any.
 *
 * **NOTE:** This function is known to output incorrect size results for
 * `bzip2`. For this compression format, this function will simply
 * return the size of the compressed file.
 *
 * @param {String} file - file path
 * @fulfil {Object} - image metadata
 * @returns {Promise}
 *
 * @example
 * const imageStream = require('./lib/image-stream');
 *
 * imageStream.getImageMetadata('path/to/rpi.img.xz').then((metadata) => {
 *   console.log(`The image display name is: ${metada.name}`);
 *   console.log(`The image url is: ${metada.url}`);
 *   console.log(`The image support url is: ${metada.supportUrl}`);
 *   console.log(`The image logo is: ${metada.logo}`);
 * });
 */
exports.getImageMetadata = (file) => {
  return exports.getFromFilePath(file).then((image) => {
    return _.omitBy(image, isStream);
  });
};

/**
 * @summary Supported file types
 * @type {String[]}
 * @public
 *
 * @example
 * const imageStream = require('./lib/image-stream');
 *
 * imageStream.supportedFileTypes.forEach((fileType) => {
 *   console.log('Supported file type: ' + fileType.extension);
 * });
 */
exports.supportedFileTypes = supportedFileTypes;
