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

const imageWrite = require('etcher-image-write');
const imageStream = require('etcher-image-stream');
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const umount = Bluebird.promisifyAll(require('umount'));
const os = require('os');
const isWindows = os.platform() === 'win32';

/**
 * @summary Write an image to a disk drive
 * @function
 * @public
 *
 * @description
 * See https://github.com/resin-io-modules/etcher-image-write for information
 * about the `state` object passed to `onProgress` callback.
 *
 * @param {String} imagePath - path to image
 * @param {Object} drive - drive
 * @param {Object} options - options
 * @param {Boolean} [options.unmountOnSuccess=false] - unmount on success
 * @param {Boolean} [options.validateWriteOnSuccess=false] - validate write on success
 * @param {Function} onProgress - on progress callback (state)
 *
 * @fulfil {Boolean} - whether the operation was successful
 * @returns {Promise}
 *
 * @example
 * writer.writeImage('path/to/image.img', {
 *   device: '/dev/disk2'
 * }, {
 *   unmountOnSuccess: true,
 *   validateWriteOnSuccess: true
 * }, (state) => {
 *   console.log(state.percentage);
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.writeImage = (imagePath, drive, options, onProgress) => {
  return umount.umountAsync(drive.device).then(() => {
    return Bluebird.props({
      image: imageStream.getFromFilePath(imagePath),
      driveFileDescriptor: fs.openAsync(drive.raw, 'rs+')
    });
  }).then((results) => {
    return imageWrite.write({
      fd: results.driveFileDescriptor,
      device: drive.raw,
      size: drive.size
    }, results.image, {
      check: options.validateWriteOnSuccess,
      transform: results.image.transform,
      bmap: results.image.bmap,
      bytesToZeroOutFromTheBeginning: results.image.bytesToZeroOutFromTheBeginning
    });
  }).then((writer) => {
    return new Bluebird((resolve, reject) => {
      writer.on('progress', onProgress);
      writer.on('error', reject);
      writer.on('done', resolve);
    });
  }).tap(() => {
    if (!options.unmountOnSuccess) {
      return;
    }

    if (isWindows && drive.mountpoint) {

      // The `can-ignore` annotation is EncloseJS (http://enclosejs.com) specific.
      const removedrive = Bluebird.promisifyAll(require('removedrive', 'can-ignore'));

      return removedrive.ejectAsync(drive.mountpoint);
    }

    return umount.umountAsync(drive.device);
  });
};
