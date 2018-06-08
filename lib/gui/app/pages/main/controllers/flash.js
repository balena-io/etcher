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
const exceptionReporter = require('../../../modules/exception-reporter')
const imageWriter = require('../../../modules/image-writer')
const path = require('path')
const store = require('../../../models/store')
const constraints = require('../../../../../shared/drive-constraints')
const availableDrives = require('../../../models/available-drives')
const selection = require('../../../models/selection-state')

module.exports = function (
  $q,
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
   * @returns {Promise}
   *
   * @example
   * displayTailoredWarning(drives, image).then(() => {
   *   console.log('Continue pressed')
   * }).catch(() => {
   *   console.log('Change pressed')
   * })
   */
  const displayTailoredWarning = (drives, image) => {
    const warningMessages = _.reduce(drives, (accumMessages, drive) => {
      if (constraints.isDriveSizeLarge(drive)) {
        return accumMessages.concat(messages.warning.largeDriveSize(drive))
      } else if (!constraints.isDriveSizeRecommended(drive, image)) {
        return accumMessages.concat(messages.warning.unrecommendedDriveSize(image, drive))
      }

      return accumMessages
    }, [])

    if (!warningMessages.length) {
      // TODO(Shou): we should consider adding the same warning dialog for system drives and remove unsafe mode
      return $q.resolve()
    }

    return confirmationWarningModal(warningMessages).then((value) => {
      if (!value) {
        DriveSelectorService.open()
        return $q.reject()
      }

      return $q.resolve()
    })
  }

  /**
   * @summary Flash image to drives
   * @function
   * @public
   *
   * @example
   * FlashController.flashImageToDrive({
   *   path: 'rpi.img',
   *   size: {
   *     original: 1000000000,
   *     final: {
   *       estimation: false,
   *       value: 1000000000
   *     }
   *   }
   * }, [
   *   '/dev/disk2',
   *   '/dev/disk5'
   * ])
   */
  this.flashImageToDrive = () => {
    const image = selection.getImage()
    const devices = selection.getSelectedDevices()

    if (flashState.isFlashing()) {
      return
    }

    const drives = _.filter(availableDrives.getDrives(), (drive) => {
      return _.includes(devices, drive.device)
    })

    const hasDangerStatus = constraints.hasListDriveImageCompatibilityStatus(drives, image)

    const userConfirm = hasDangerStatus ? _.partial(displayTailoredWarning, drives, image) : $q.resolve

    // Trigger Angular digests along with store updates, as the flash state
    // updates. Without this there is essentially no progress to watch.
    const unsubscribe = store.observe($timeout)

    const iconPath = '../../../assets/icon.png'

    userConfirm().then(() => {
      // Stop scanning drives when flashing
      // otherwise Windows throws EPERM
      driveScanner.stop()

      return imageWriter.flash(image.path, drives)
    }).then(() => {
      if (!flashState.wasLastFlashCancelled()) {
        const flashResults = flashState.getFlashResults()
        notification.send('Flash complete!', {
          body: messages.info.flashComplete(path.basename(image.path), drives, flashResults.results.devices),
          icon: iconPath
        })
        $state.go('success')
      }
    }).catch((error) => {
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
        exceptionReporter.report(error)
      }
    }).finally(() => {
      driveScanner.start()
      unsubscribe()
    })
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
