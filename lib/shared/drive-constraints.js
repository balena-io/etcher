/*
 * Copyright 2016 balena.io
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
const pathIsInside = require('path-is-inside')
const prettyBytes = require('pretty-bytes')
// eslint-disable-next-line node/no-missing-require
const messages = require('./messages')

/**
 * @summary The default unknown size for things such as images and drives
 * @constant
 * @private
 * @type {Number}
 */
const UNKNOWN_SIZE = 0

/**
 * @summary Check if a drive is locked
 * @function
 * @public
 *
 * @description
 * This usually points out a locked SD Card.
 *
 * @param {Object} drive - drive
 * @returns {Boolean} whether the drive is locked
 *
 * @example
 * if (constraints.isDriveLocked({
 *   device: '/dev/disk2',
 *   name: 'My Drive',
 *   size: 123456789,
 *   isReadOnly: true
 * })) {
 *   console.log('This drive is locked (e.g: write-protected)');
 * }
 */
exports.isDriveLocked = (drive) => {
  return Boolean(_.get(drive, [ 'isReadOnly' ], false))
}

/**
 * @summary Check if a drive is a system drive
 * @function
 * @public
 * @param {Object} drive - drive
 * @returns {Boolean} whether the drive is a system drive
 *
 * @example
 * if (constraints.isSystemDrive({
 *   device: '/dev/disk2',
 *   name: 'My Drive',
 *   size: 123456789,
 *   isReadOnly: true,
 *   system: true
 * })) {
 *   console.log('This drive is a system drive!');
 * }
 */
exports.isSystemDrive = (drive) => {
  return Boolean(_.get(drive, [ 'isSystem' ], false))
}

/**
 * @summary Check if a drive is source drive
 * @function
 * @public
 *
 * @description
 * In the context of Etcher, a source drive is a drive
 * containing the image.
 *
 * @param {Object} drive - drive
 * @param {Object} image - image
 * @returns {Boolean} whether the drive is a source drive
 *
 *
 * @example
 * if (constraints.isSourceDrive({
 *   device: '/dev/disk2',
 *   name: 'My Drive',
 *   size: 123456789,
 *   isReadOnly: true,
 *   system: true,
 *   mountpoints: [
 *     {
 *       path: '/Volumes/Untitled'
 *     }
 *   ]
 * }, {
 *   path: '/Volumes/Untitled/image.img',
 *   size: 1000000000,
 *   compressedSize: 1000000000,
 *   isSizeEstimated: false,
 * })) {
 *   console.log('This drive is a source drive!');
 * }
 */
exports.isSourceDrive = (drive, image) => {
  const mountpoints = _.get(drive, [ 'mountpoints' ], [])
  const imagePath = _.get(image, [ 'path' ])

  if (!imagePath || _.isEmpty(mountpoints)) {
    return false
  }

  return _.some(_.map(mountpoints, (mountpoint) => {
    return pathIsInside(imagePath, mountpoint.path)
  }))
}

/**
 * @summary Check if a drive is large enough for an image
 * @function
 * @public
 *
 * @param {Object} drive - drive
 * @param {Object} image - image
 * @returns {Boolean} whether the drive is large enough
 *
 * @example
 * if (constraints.isDriveLargeEnough({
 *   device: '/dev/disk2',
 *   name: 'My Drive',
 *   size: 1000000000
 * }, {
 *   path: 'rpi.img',
 *   size: 1000000000,
 *   compressedSize: 1000000000,
 *   isSizeEstimated: false,
 * })) {
 *   console.log('We can flash the image to this drive!');
 * }
 */
exports.isDriveLargeEnough = (drive, image) => {
  const driveSize = _.get(drive, [ 'size' ], UNKNOWN_SIZE)

  if (_.get(image, [ 'isSizeEstimated' ])) {
    // If the drive size is smaller than the original image size, and
    // the final image size is just an estimation, then we stop right
    // here, based on the assumption that the final size will never
    // be less than the original size.
    if (driveSize < _.get(image, [ 'compressedSize' ], UNKNOWN_SIZE)) {
      return false
    }

    // If the final image size is just an estimation then consider it
    // large enough. In the worst case, the user gets an error saying
    // the drive has ran out of space, instead of prohibiting the flash
    // at all, when the estimation may be wrong.
    return true
  }

  return driveSize >= _.get(image, [ 'size' ], UNKNOWN_SIZE)
}

/**
 * @summary Check if a drive is disabled (i.e. not ready for selection)
 * @function
 * @public
 *
 * @param {Object} drive - drive
 * @returns {Boolean} whether the drive is disabled
 *
 * @example
 * if (constraints.isDriveDisabled({
 *   device: '/dev/disk2',
 *   name: 'My Drive',
 *   size: 1000000000,
 *   disabled: true
 * })) {
 *   console.log('The drive is disabled');
 * }
 */
exports.isDriveDisabled = (drive) => {
  return _.get(drive, [ 'disabled' ], false)
}

/**
 * @summary Check if a drive is valid, i.e. not locked and large enough for an image
 * @function
 * @public
 *
 * @param {Object} drive - drive
 * @param {Object} image - image
 * @returns {Boolean} whether the drive is valid
 *
 * @example
 * if (constraints.isDriveValid({
 *   device: '/dev/disk2',
 *   name: 'My Drive',
 *   size: 1000000000,
 *   isReadOnly: false
 * }, {
 *   path: 'rpi.img',
 *   size: 1000000000,
 *   compressedSize: 1000000000,
 *   isSizeEstimated: false,
 *   recommendedDriveSize: 2000000000
 * })) {
 *   console.log('This drive is valid!');
 * }
 */
exports.isDriveValid = (drive, image) => {
  return !this.isDriveLocked(drive) &&
    this.isDriveLargeEnough(drive, image) &&
    !this.isSourceDrive(drive, image) &&
    !this.isDriveDisabled(drive)
}

/**
 * @summary Check if a drive meets the recommended drive size suggestion
 * @function
 * @public
 *
 * @description
 * If the image doesn't have a recommended size, this function returns true.
 *
 * @param {Object} drive - drive
 * @param {Object} image - image
 * @returns {Boolean} whether the drive size is recommended
 *
 * @example
 * const drive = {
 *   device: '/dev/disk2',
 *   name: 'My Drive',
 *   size: 4000000000
 * };
 *
 * const image = {
 *   path: 'rpi.img',
 *   size: 2000000000,
 *   compressedSize: 2000000000,
 *   isSizeEstimated: false,
 *   recommendedDriveSize: 4000000000
 * });
 *
 * if (constraints.isDriveSizeRecommended(drive, image)) {
 *   console.log('We meet the recommended drive size!');
 * }
 */
exports.isDriveSizeRecommended = (drive, image) => {
  return _.get(drive, [ 'size' ], UNKNOWN_SIZE) >= _.get(image, [ 'recommendedDriveSize' ], UNKNOWN_SIZE)
}

/**
 * @summary 64GB
 * @private
 * @constant
 */
exports.LARGE_DRIVE_SIZE = 64e9

/**
 * @summary Check whether a drive's size is 'large'
 * @public
 *
 * @param {Object} drive - drive
 * @returns {Boolean} whether drive size is large
 *
 * @example
 * if (constraints.isDriveSizeLarge(drive)) {
 *   console.log('Impressive')
 * }
 */
exports.isDriveSizeLarge = (drive) => {
  return _.get(drive, [ 'size' ], UNKNOWN_SIZE) > exports.LARGE_DRIVE_SIZE
}

/**
 * @summary Drive/image compatibility status types.
 * @public
 * @type {Object}
 *
 * @description
 * Status types classifying what kind of message it is, i.e. error, warning.
 */
exports.COMPATIBILITY_STATUS_TYPES = {
  WARNING: 1,
  ERROR: 2
}

/**
 * @summary Get drive/image compatibility in an object
 * @function
 * @public
 *
 * @description
 * Given an image and a drive, return their compatibility status object
 * containing the status type (ERROR, WARNING), and accompanying
 * status message.
 *
 * @param {Object} drive - drive
 * @param {Object} image - image
 * @returns {Object[]} list of compatibility status objects
 *
 * @example
 * const drive = {
 *   device: '/dev/disk2',
 *   name: 'My Drive',
 *   size: 4000000000
 * };
 *
 * const image = {
 *   path: '/path/to/rpi.img',
 *   size: 2000000000,
 *   compressedSize: 2000000000,
 *   isSizeEstimated: false,
 *   recommendedDriveSize: 4000000000
 * });
 *
 * const statuses = constraints.getDriveImageCompatibilityStatuses(drive, image);
 *
 * for ({ type, message } of statuses) {
 *   if (type === constraints.COMPATIBILITY_STATUS_TYPES.WARNING) {
 *     // do something
 *   } else if (type === constraints.COMPATIBILITY_STATUS_TYPES.ERROR) {
 *     // do something else
 *   }
 * }
 */
exports.getDriveImageCompatibilityStatuses = (drive, image) => {
  const statusList = []

  // Mind the order of the if-statements if you modify.
  if (exports.isSourceDrive(drive, image)) {
    statusList.push({
      type: exports.COMPATIBILITY_STATUS_TYPES.ERROR,
      message: messages.compatibility.containsImage()
    })
  } else if (exports.isDriveLocked(drive)) {
    statusList.push({
      type: exports.COMPATIBILITY_STATUS_TYPES.ERROR,
      message: messages.compatibility.locked()
    })
  } else if (!_.isNil(drive) && !_.isNil(drive.size) && !exports.isDriveLargeEnough(drive, image)) {
    const imageSize = image.isSizeEstimated ? image.compressedSize : image.size
    const relativeBytes = imageSize - drive.size
    statusList.push({
      type: exports.COMPATIBILITY_STATUS_TYPES.ERROR,
      message: messages.compatibility.tooSmall(prettyBytes(relativeBytes))
    })
  } else {
    if (exports.isSystemDrive(drive)) {
      statusList.push({
        type: exports.COMPATIBILITY_STATUS_TYPES.WARNING,
        message: messages.compatibility.system()
      })
    }

    if (exports.isDriveSizeLarge(drive)) {
      statusList.push({
        type: exports.COMPATIBILITY_STATUS_TYPES.WARNING,
        message: messages.compatibility.largeDrive()
      })
    }

    if (!_.isNil(drive) && !exports.isDriveSizeRecommended(drive, image)) {
      statusList.push({
        type: exports.COMPATIBILITY_STATUS_TYPES.WARNING,
        message: messages.compatibility.sizeNotRecommended()
      })
    }
  }

  return statusList
}

/**
 * @summary Get drive/image compatibility status for many drives
 * @function
 * @public
 *
 * @description
 * Given an image and a list of drives, return all compatibility status objects,
 * containing the status type (ERROR, WARNING), and accompanying status message.
 *
 * @param {Object[]} drives - drives
 * @param {Object} image - image
 * @returns {Object[]} list of compatibility status objects
 *
 * @example
 * const drives = [
 *   {
 *     device: '/dev/disk2',
 *     name: 'My Drive',
 *     size: 4000000000
 *   },
 *   {
 *     device: '/dev/disk1',
 *     name: 'My Other Drive',
 *     size: 780000000
 *   }
 * ]
 *
 * const image = {
 *   path: '/path/to/rpi.img',
 *   size: 2000000000,
 *   compressedSize: 2000000000,
 *   isSizeEstimated: false,
 *   recommendedDriveSize: 4000000000
 * })
 *
 * const statuses = constraints.getListDriveImageCompatibilityStatuses(drives, image)
 *
 * for ({ type, message } of statuses) {
 *   if (type === constraints.COMPATIBILITY_STATUS_TYPES.WARNING) {
 *     // do something
 *   } else if (type === constraints.COMPATIBILITY_STATUS_TYPES.ERROR) {
 *     // do something else
 *   }
 * }
 */
exports.getListDriveImageCompatibilityStatuses = (drives, image) => {
  return _.flatMap(drives, (drive) => {
    return exports.getDriveImageCompatibilityStatuses(drive, image)
  })
}

/**
 * @summary Does the drive/image pair have at least one compatibility status?
 * @function
 * @public
 *
 * @description
 * Given an image and a drive, return whether they have a connected compatibility status object.
 *
 * @param {Object} drive - drive
 * @param {Object} image - image
 * @returns {Boolean}
 *
 * @example
 * if (constraints.hasDriveImageCompatibilityStatus(drive, image)) {
 *   console.log('This drive-image pair has a compatibility status message!')
 * }
 */
exports.hasDriveImageCompatibilityStatus = (drive, image) => {
  return Boolean(exports.getDriveImageCompatibilityStatuses(drive, image).length)
}

/**
 * @summary Does any drive/image pair have at least one compatibility status?
 * @function
 * @public
 *
 * @description
 * Given an image and a drive, return whether they have a connected compatibility status object.
 *
 * @param {Object[]} drives - drives
 * @param {Object} image - image
 * @returns {Boolean}
 *
 * @example
 * if (constraints.hasDriveImageCompatibilityStatus(drive, image)) {
 *   console.log('This drive-image pair has a compatibility status message!')
 * }
 */
exports.hasListDriveImageCompatibilityStatus = (drives, image) => {
  return Boolean(exports.getListDriveImageCompatibilityStatuses(drives, image).length)
}
