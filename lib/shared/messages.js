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

/* eslint-disable lodash/prefer-constant */

'use strict'

/**
 * @summary Application messages
 * @namespace messages
 * @public
 */
module.exports = {

  /**
   * @summary Progress messages
   * @namespace progress
   * @memberof messages
   */
  progress: {

    successful: (quantity) => {
      // eslint-disable-next-line no-magic-numbers
      const plural = quantity === 1 ? '' : 's'
      return `Successful device${plural}`
    },

    failed: (quantity) => {
      // eslint-disable-next-line no-magic-numbers
      const plural = quantity === 1 ? '' : 's'
      return `Failed device${plural}`
    }
  },

  /**
   * @summary Informational messages
   * @namespace info
   * @memberof messages
   */
  info: {

    flashComplete: (imageBasename, [ drive ], { failed, successful }) => {
      /* eslint-disable no-magic-numbers */
      const targets = []
      if (failed + successful === 1) {
        targets.push(`to ${drive.description} (${drive.displayName})`)
      } else {
        if (successful) {
          const plural = successful === 1 ? '' : 's'
          targets.push(`to ${successful} target${plural}`)
        }
        if (failed) {
          const plural = failed === 1 ? '' : 's'
          targets.push(`and failed to be flashed to ${failed} target${plural}`)
        }
      }
      return `${imageBasename} was successfully flashed ${targets.join(' ')}`
      /* eslint-enable no-magic-numbers */
    }

  },

  /**
   * @summary Drive compatibility messages
   * @namespace compatibility
   * @memberof messages
   */
  compatibility: {

    sizeNotRecommended () {
      return 'Not Recommended'
    },

    tooSmall (additionalSpace) {
      return `Insufficient space, additional ${additionalSpace} required`
    },

    locked () {
      return 'Locked'
    },

    system () {
      return 'System Drive'
    },

    containsImage () {
      return 'Drive Mountpoint Contains Image'
    },

    // The drive is large and therefore likely not a medium you want to write to.
    largeDrive () {
      return 'Large Drive'
    }

  },

  /**
   * @summary Warning messages
   * @namespace warning
   * @memberof messages
   */
  warning: {

    unrecommendedDriveSize: (image, drive) => {
      return [
        `This image recommends a ${image.recommendedDriveSize}`,
        `bytes drive, however ${drive.device} is only ${drive.size} bytes.`
      ].join(' ')
    },

    exitWhileFlashing: () => {
      return [
        'You are currently flashing a drive.',
        'Closing Etcher may leave your drive in an unusable state.'
      ].join(' ')
    },

    looksLikeWindowsImage: () => {
      return [
        'It looks like you are trying to burn a Windows image.\n\n',
        'Unlike other images, Windows images require special processing to be made bootable.',
        'We suggest you use a tool specially designed for this purpose, such as',
        '<a href="https://rufus.akeo.ie">Rufus</a> (Windows),',
        '<a href="https://github.com/slacka/WoeUSB">WoeUSB</a> (Linux),',
        'or Boot Camp Assistant (macOS).'
      ].join(' ')
    },

    missingPartitionTable: () => {
      return [
        'It looks like this is not a bootable image.\n\n',
        'The image does not appear to contain a partition table,',
        'and might not be recognized or bootable by your device.'
      ].join(' ')
    },

    largeDriveSize: (drive) => {
      return [
        `Drive ${drive.description} (${drive.device}) is unusually large for an SD card or USB stick.`,
        '\n\nAre you sure you want to flash this drive?'
      ].join(' ')
    }

  },

  /**
   * @summary Error messages
   * @namespace error
   * @memberof messages
   */
  error: {

    notEnoughSpaceInDrive: () => {
      return [
        'Not enough space on the drive.',
        'Please insert larger one and try again.'
      ].join(' ')
    },

    genericFlashError: () => {
      return 'Oops, seems something went wrong.'
    },

    validation: () => {
      return [
        'The write has been completed successfully but Etcher detected potential',
        'corruption issues when reading the image back from the drive.',
        '\n\nPlease consider writing the image to a different drive.'
      ].join(' ')
    },

    invalidImage: (image) => {
      return `${image.path} is not a supported image type.`
    },

    openImage: (imageBasename, errorMessage) => {
      return [
        `Something went wrong while opening ${imageBasename}\n\n`,
        `Error: ${errorMessage}`
      ].join('')
    },

    elevationRequired: () => {
      return 'This should should be run with root/administrator permissions.'
    },

    flashFailure: (imageBasename, drives) => {
      /* eslint-disable no-magic-numbers */
      const target = drives.length === 1
        ? `${drives[0].description} (${drives[0].displayName})`
        : `${drives.length} targets`
      return `Something went wrong while writing ${imageBasename} to ${target}.`
      /* eslint-enable no-magic-numbers */
    },

    driveUnplugged: () => {
      return [
        'Looks like Etcher lost access to the drive.',
        'Did it get unplugged accidentally?',
        '\n\nSometimes this error is caused by faulty readers that don\'t provide stable access to the drive.'
      ].join(' ')
    },

    inputOutput: () => {
      return [
        'Looks like Etcher is not able to write to this location of the drive.',
        'This error is usually caused by a faulty drive, reader, or port.',
        '\n\nPlease try again with another drive, reader, or port.'
      ].join(' ')
    },

    childWriterDied: () => {
      return [
        'The writer process ended unexpectedly.',
        'Please try again, and contact the Etcher team if the problem persists.'
      ].join(' ')
    }

  }

}
