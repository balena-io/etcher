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
const messages = require('../../../../../shared/messages')
const flashState = require('../../../models/flash-state')
const driveScanner = require('../../../modules/drive-scanner')
const progressStatus = require('../../../modules/progress-status')
const notification = require('../../../os/notification')
const analytics = require('../../../modules/analytics')
const imageWriter = require('../../../modules/image-writer')
const path = require('path')
const store = require('../../../models/store')
const constraints = require('../../../../../shared/drive-constraints')
const availableDrives = require('../../../models/available-drives')
const selection = require('../../../models/selection-state')

module.exports = function (
  $state,
  $timeout,
  FlashErrorModalService,
  WarningModalService,
  DriveSelectorService
) {
  /**
   * @summary Spawn a confirmation warning modal
   * @function
   * @public
   *
   * @param {Array<String>} warningMessages - warning messages
   * @returns {Promise} warning modal promise
   *
   * @example
   * confirmationWarningModal([ 'Hello, World!' ])
   */
  const confirmationWarningModal = (warningMessages) => {
    return WarningModalService.display({
      confirmationLabel: 'Continue',
      rejectionLabel: 'Change',
      description: [
        warningMessages.join('\n\n'),
        'Are you sure you want to continue?'
      ].join(' ')
    })
  }

  /**
   * @summary Display warning tailored to the warning of the current drives-image pair
   * @function
   * @public
   *
   * @param {Array<Object>} drives - list of drive objects
   * @param {Object} image - image object
   * @returns {Promise<Boolean>}
   *
   * @example
   * displayTailoredWarning(drives, image).then((ok) => {
   *   if (ok) {
   *     console.log('No warning was shown or continue was pressed')
   *   } else {
   *     console.log('Change was pressed')
   *   }
   * })
   */
  const displayTailoredWarning = async (drives, image) => {
    const warningMessages = []
    for (const drive of drives) {
      if (constraints.isDriveSizeLarge(drive)) {
        warningMessages.push(messages.warning.largeDriveSize(drive))
      } else if (!constraints.isDriveSizeRecommended(drive, image)) {
        warningMessages.push(messages.warning.unrecommendedDriveSize(image, drive))
      }

      // TODO(Shou): we should consider adding the same warning dialog for system drives and remove unsafe mode
    }

    if (!warningMessages.length) {
      return true
    }

    return confirmationWarningModal(warningMessages)
  }

  /**
   * @summary Flash image to drives
   * @function
   * @public
   *
   * @example
   * FlashController.flashImageToDrive({
   *   path: 'rpi.img',
   *   size: 1000000000,
   *   compressedSize: 1000000000,
   *   isSizeEstimated: false,
   * }, [
   *   '/dev/disk2',
   *   '/dev/disk5'
   * ])
   */
  this.flashImageToDrive = async () => {
    const devices = selection.getSelectedDevices()
    const image = selection.getImage()
    const drives = _.filter(availableDrives.getDrives(), (drive) => {
      return _.includes(devices, drive.device)
    })

    // eslint-disable-next-line no-magic-numbers
    if (drives.length === 0) {
      return
    }

    const hasDangerStatus = constraints.hasListDriveImageCompatibilityStatus(drives, image)
    if (hasDangerStatus) {
      if (!(await displayTailoredWarning(drives, image))) {
        DriveSelectorService.open()
        return
      }
    }

    if (flashState.isFlashing()) {
      return
    }

    // Trigger Angular digests along with store updates, as the flash state
    // updates. Without this there is essentially no progress to watch.
    const unsubscribe = store.observe($timeout)

    // Stop scanning drives when flashing
    // otherwise Windows throws EPERM
    driveScanner.stop()

    const iconPath = '../../../assets/icon.png'
    const basename = path.basename(image.path)
    try {
      await imageWriter.flash(image.path, drives)
      if (!flashState.wasLastFlashCancelled()) {
        const flashResults = flashState.getFlashResults()
        notification.send('Flash complete!', {
          body: messages.info.flashComplete(basename, drives, flashResults.results.devices),
          icon: iconPath
        })
        $state.go('success')
      }
    } catch (error) {
      // When flashing is cancelled before starting above there is no error
      if (!error) {
        return
      }

      notification.send('Oops! Looks like the flash failed.', {
        body: messages.error.flashFailure(path.basename(image.path), drives),
        icon: iconPath
      })

      // TODO: All these error codes to messages translations
      // should go away if the writer emitted user friendly
      // messages on the first place.
      if (error.code === 'EVALIDATION') {
        FlashErrorModalService.show(messages.error.validation())
      } else if (error.code === 'EUNPLUGGED') {
        FlashErrorModalService.show(messages.error.driveUnplugged())
      } else if (error.code === 'EIO') {
        FlashErrorModalService.show(messages.error.inputOutput())
      } else if (error.code === 'ENOSPC') {
        FlashErrorModalService.show(messages.error.notEnoughSpaceInDrive())
      } else if (error.code === 'ECHILDDIED') {
        FlashErrorModalService.show(messages.error.childWriterDied())
      } else {
        FlashErrorModalService.show(messages.error.genericFlashError())
        error.image = basename
        analytics.logException(error)
      }
    } finally {
      availableDrives.setDrives([])
      driveScanner.start()
      unsubscribe()
    }
  }

  /**
   * @summary Get progress button label
   * @function
   * @public
   *
   * @returns {String} progress button label
   *
   * @example
   * const label = FlashController.getProgressButtonLabel()
   */
  this.getProgressButtonLabel = () => {
    if (!flashState.isFlashing()) {
      return 'Flash!'
    }

    return progressStatus.fromFlashState(flashState.getFlashState())
  }

  /**
   * @summary Abort write process
   * @function
   * @public
   *
   * @example
   * FlashController.cancelFlash()
   */
  this.cancelFlash = imageWriter.cancel
}
