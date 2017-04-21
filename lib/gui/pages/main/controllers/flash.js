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

module.exports = function(
  $state,
  DriveScannerService,
  ImageWriterService,
  FlashErrorModalService,
  ErrorService,
  OSNotificationService
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
    DriveScannerService.stop();

    ImageWriterService.flash(image.path, drive).then(() => {
      if (!flashState.wasLastFlashCancelled()) {
        OSNotificationService.send('Success!', messages.info.flashComplete());
        $state.go('success');
      }
    })
    .catch((error) => {
      OSNotificationService.send('Oops!', messages.error.flashFailure());

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
        ErrorService.reportException(error);
      }

    })
    .finally(() => {
      DriveScannerService.start();
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
    const PERCENTAGE_MINIMUM = 0;
    const PERCENTAGE_MAXIMUM = 100;

    if (!flashState.isFlashing()) {
      return 'Flash!';
    } else if (currentFlashState.percentage === PERCENTAGE_MINIMUM && !currentFlashState.speed) {
      return 'Starting...';
    } else if (currentFlashState.percentage === PERCENTAGE_MAXIMUM) {
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
