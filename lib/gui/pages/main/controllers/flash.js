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

const messages = require('../../../../shared/messages');
const settings = require('../../../models/settings');
const flashState = require('../../../models/flash-state');
const driveScanner = require('../../../modules/drive-scanner');
const utils = require('../../../../shared/utils');
const notification = require('../../../os/notification');
const path = require('path');

module.exports = function(
  $state,
  ImageWriterService,
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
   *   size: 1000000000
   * }, {
   *   device: '/dev/disk2',
   *   description: 'Foo',
   *   size: 99999,
   *   mountpoint: '/mnt/foo',
   *   system: false
   * });
   */
  this.flashImageToDrive = (image, drive) => {
    if (flashState.isFlashing()) {
      return;
    }

    // Stop scanning drives when flashing
    // otherwise Windows throws EPERM
    driveScanner.stop();

    const iconPath = '../../assets/icon.png';

    ImageWriterService.flash(image.path, drive).then(() => {
      if (!flashState.wasLastFlashCancelled()) {
        notification.send('Success!', {
          body: messages.info.flashComplete({
            imageBasename: path.basename(image.path),
            drive
          }),
          icon: iconPath
        });
        $state.go('success');
      }
    })
    .catch((error) => {
      notification.send('Oops! Looks like the flash failed.', {
        body: messages.error.flashFailure({
          imageBasename: path.basename(image.path),
          drive
        }),
        icon: iconPath
      });

      // TODO: All these error codes to messages translations
      // should go away if the writer emitted user friendly
      // messages on the first place.
      if (error.code === 'EVALIDATION') {
        FlashErrorModalService.show(messages.error.validation());
      } else if (error.code === 'EUNPLUGGED') {
        FlashErrorModalService.show(messages.error.driveUnplugged());
      } else if (error.code === 'EIO') {
        FlashErrorModalService.show(messages.error.inputOutput());
      } else if (error.code === 'ENOSPC') {
        FlashErrorModalService.show(messages.error.notEnoughSpaceInDrive());
      } else {
        FlashErrorModalService.show(messages.error.genericFlashError());
        error.reportException(error);
      }

    })
    .finally(() => {
      driveScanner.start();
    });
  };

  /**
   * @summary Get progress button label
   * @function
   * @public
   *
   * @returns {String} progress button label
   *
   * @example
   * const label = FlashController.getProgressButtonLabel();
   */
  this.getProgressButtonLabel = () => {
    const currentFlashState = flashState.getFlashState();
    const isChecking = currentFlashState.type === 'check';

    if (!flashState.isFlashing()) {
      return 'Flash!';
    } else if (currentFlashState.percentage === utils.PERCENTAGE_MINIMUM && !currentFlashState.speed) {
      return 'Starting...';
    } else if (currentFlashState.percentage === utils.PERCENTAGE_MAXIMUM) {
      if (isChecking && settings.get('unmountOnSuccess')) {
        return 'Unmounting...';
      }

      return 'Finishing...';
    } else if (isChecking) {
      return `${currentFlashState.percentage}% Validating...`;
    }

    return `${currentFlashState.percentage}%`;
  };

};
