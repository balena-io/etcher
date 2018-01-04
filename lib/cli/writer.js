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

const _ = require('lodash')
const Bluebird = require('bluebird')
const fs = Bluebird.promisifyAll(require('fs'))
const mountutils = Bluebird.promisifyAll(require('mountutils'))
const drivelist = Bluebird.promisifyAll(require('drivelist'))
const os = require('os')
const imageStream = require('../image-stream')
const errors = require('../shared/errors')
const constraints = require('../shared/drive-constraints')
const ImageWriter = require('../writer')
const diskpart = require('./diskpart')

/**
 * @summary Timeout, in milliseconds, to wait before unmounting on success
 * @constant
 * @type {Number}
 */
const UNMOUNT_ON_SUCCESS_TIMEOUT_MS = 2000

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
  return drivelist.listAsync().then((drives) => {
    const selectedDrive = _.find(drives, {
      device: drive
    })

    if (!selectedDrive) {
      throw errors.createUserError({
        title: 'The selected drive was not found',
        description: `We can't find ${drive} in your system. Did you unplug the drive?`,
        code: 'EUNPLUGGED'
      })
    }

    return selectedDrive
  }).then((driveObject) => {
    return Bluebird.try(() => {
      // Unmounting a drive in Windows means we can't write to it anymore
      if (os.platform() === 'win32') {
        return Bluebird.resolve()
      }

      return mountutils.unmountDiskAsync(driveObject.device)
    }).then(() => {
      return diskpart.clean(driveObject.device)
    }).then(() => {
      /* eslint-disable no-bitwise */
      const flags = fs.constants.O_RDWR |
        fs.constants.O_EXCL |
        fs.constants.O_NONBLOCK |
        fs.constants.O_SYNC |
        fs.constants.O_DIRECT
      /* eslint-enable no-bitwise */

      return fs.openAsync(driveObject.raw, flags)
    }).then((driveFileDescriptor) => {
      return imageStream.getFromFilePath(imagePath).then((image) => {
        if (!constraints.isDriveLargeEnough(driveObject, image)) {
          throw errors.createUserError({
            title: 'The image you selected is too big for this drive',
            description: 'Please connect a bigger drive and try again'
          })
        }

        const writer = new ImageWriter({
          image,
          fd: driveFileDescriptor,
          path: driveObject.raw,
          verify: options.validateWriteOnSuccess,
          checksumAlgorithms: [ 'crc32' ]
        })

        return writer.write()
      }).then((writer) => {
        return new Bluebird((resolve, reject) => {
          writer.on('progress', onProgress)
          writer.on('error', reject)
          writer.on('finish', (results) => {
            results.drive = driveObject
            resolve(results)
          })
        })
      }).tap(() => {
        // Make sure the device stream file descriptor is closed
        // before returning control the the caller. Not closing
        // the file descriptor (and waiting for it) results in
        // `EBUSY` errors when attempting to unmount the drive
        // right afterwards in some Windows 7 systems.
        return fs.closeAsync(driveFileDescriptor).then(() => {
          if (!options.unmountOnSuccess) {
            return Bluebird.resolve()
          }

          // Closing a file descriptor on a drive containing mountable
          // partitions causes macOS to mount the drive. If we try to
          // unmount to quickly, then the drive might get re-mounted
          // right afterwards.
          return Bluebird.delay(UNMOUNT_ON_SUCCESS_TIMEOUT_MS)
            .return(driveObject.device)
            .then(mountutils.unmountDiskAsync)
        })
      })
    })
  })
}
