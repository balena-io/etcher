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
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const mountutils = Bluebird.promisifyAll(require('mountutils'));
const os = require('os');
const imageStream = require('../image-stream');
const errors = require('../shared/errors');
const constraints = require('../shared/drive-constraints');

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
  return Bluebird.try(() => {

    // Unmounting a drive in Windows means we can't write to it anymore
    if (os.platform() === 'win32') {
      return Bluebird.resolve();
    }

    return mountutils.unmountDiskAsync(drive.device);
  }).then(() => {
    return fs.openAsync(drive.raw, 'rs+');
  }).then((driveFileDescriptor) => {
    return imageStream.getFromFilePath(imagePath).then((image) => {
      if (!constraints.isDriveLargeEnough(drive, image)) {
        throw errors.createUserError(
          'The image you selected is too big for this drive',
          'Please connect a bigger drive and try again'
        );
      }

      return imageWrite.write({
        fd: driveFileDescriptor,
        device: drive.raw,
        size: drive.size
      }, {
        stream: image.stream,
        size: image.size.original
      }, {
        check: options.validateWriteOnSuccess,
        transform: image.transform,
        bmap: image.bmap,
        bytesToZeroOutFromTheBeginning: image.bytesToZeroOutFromTheBeginning
      });
    }).then((writer) => {
      return new Bluebird((resolve, reject) => {
        writer.on('progress', onProgress);
        writer.on('error', reject);
        writer.on('done', resolve);
      });
    }).tap(() => {

      // Make sure the device stream file descriptor is closed
      // before returning control the the caller. Not closing
      // the file descriptor (and waiting for it) results in
      // `EBUSY` errors when attempting to unmount the drive
      // right afterwards in some Windows 7 systems.
      return fs.closeAsync(driveFileDescriptor).then(() => {

        if (!options.unmountOnSuccess) {
          return Bluebird.resolve();
        }

        return mountutils.unmountDiskAsync(drive.device);
      });
    });
  });
};
