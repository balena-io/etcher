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

const Bluebird = require('bluebird')
const ImageWriter = require('../sdk/writer')

/**
 * @summary Write an image to a disk drive
 * @function
 * @public
 *
 * @param {String} imagePath - path to image
 * @param {String} drive - drive
 * @param {Object} options - options
 * @param {Boolean} [options.unmountOnSuccess=false] - unmount on success
 * @param {Boolean} [options.validateWriteOnSuccess=false] - validate write on success
 * @param {Function} onProgress - on progress callback (state)
 *
 * @fulfil {Boolean} - whether the operation was successful
 * @returns {Promise}
 *
 * @example
 * writer.writeImage('path/to/image.img', '/dev/disk2', {
 *   unmountOnSuccess: true,
 *   validateWriteOnSuccess: true
 * }, (state) => {
 *   console.log(state.percentage);
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.writeImage = (imagePath, drive, options, onProgress) => {
  const writer = new ImageWriter({
    path: drive,
    imagePath,
    verify: options.validateWriteOnSuccess,
    checksumAlgorithms: [ 'md5' ],
    unmountOnSuccess: options.unmountOnSuccess
  })

  return new Bluebird((resolve, reject) => {
    writer.flash()
      .on('error', reject)
      .on('progress', onProgress)
      .on('finish', resolve)
  })
}
