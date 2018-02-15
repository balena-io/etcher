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

const messages = require('../../../../../shared/messages')
const flashState = require('../../../../../shared/models/flash-state')
const driveScanner = require('../../../modules/drive-scanner')
const progressStatus = require('../../../modules/progress-status')
const notification = require('../../../os/notification')
const exceptionReporter = require('../../../modules/exception-reporter')
const imageWriter = require('../../../modules/image-writer')
const path = require('path')
const store = require('../../../../../shared/store')

module.exports = function (
  $state,
  $timeout,
  FlashErrorModalService
) {
  /**
   * @summary Flash image to a drive
   * @function
   * @public
   *
   * @param {Object} image - image
   * @param {Object} drive - drive
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
   * }, {
   *   device: '/dev/disk2',
   *   description: 'Foo',
   *   size: 99999,
   *   mountpoint: '/mnt/foo',
   *   system: false
   * })
   */
  this.flashImageToDrive = (image, drive) => {
    if (flashState.isFlashing()) {
      return
    }

    // Stop scanning drives when flashing
    // otherwise Windows throws EPERM
    driveScanner.stop()

    // Trigger Angular digests along with store updates, as the flash state
    // updates. Without this there is essentially no progress to watch.
    const unsubscribe = store.subscribe($timeout)

    const iconPath = '../../../assets/icon.png'

    imageWriter.flash(image.path, drive).then(() => {
      if (!flashState.wasLastFlashCancelled()) {
        notification.send('Success!', {
          body: messages.info.flashComplete(path.basename(image.path), drive),
          icon: iconPath
        })
        $state.go('success')
      }
    }).catch((error) => {
      notification.send('Oops! Looks like the flash failed.', {
        body: messages.error.flashFailure(path.basename(image.path), drive),
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
}
