/*
 * Copyright 2016 Resin.io
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

module.exports = function(
  $state,
  FlashStateModel,
  SettingsModel,
  DriveScannerService,
  ImageWriterService,
  AnalyticsService,
  ErrorService,
  OSNotificationService,
  OSWindowProgressService
) {

  /**
   * @summary Flash image to a drive
   * @function
   * @public
   *
   * @param {String} image - image path
   * @param {Object} drive - drive
   *
   * @example
   * FlashController.flashImageToDrive('rpi.img', {
   *   device: '/dev/disk2',
   *   description: 'Foo',
   *   size: 99999,
   *   mountpoint: '/mnt/foo',
   *   system: false
   * });
   */
  this.flashImageToDrive = (image, drive) => {
    if (FlashStateModel.isFlashing()) {
      return;
    }

    // Stop scanning drives when flashing
    // otherwise Windows throws EPERM
    DriveScannerService.stop();

    AnalyticsService.logEvent('Flash', {
      image: image,
      device: drive.device
    });

    ImageWriterService.flash(image, drive).then(() => {
      if (FlashStateModel.wasLastFlashCancelled()) {
        return;
      }

      if (FlashStateModel.wasLastFlashSuccessful()) {
        OSNotificationService.send('Success!', 'Your flash is complete');
        AnalyticsService.logEvent('Done');
        $state.go('success');
      } else {
        OSNotificationService.send('Oops!', 'Looks like your flash has failed');
        AnalyticsService.logEvent('Validation error');
      }
    })
    .catch((error) => {

      if (error.type === 'check') {
        AnalyticsService.logEvent('Validation error');
      } else {
        AnalyticsService.logEvent('Flash error');
      }

      ErrorService.reportException(error);
    })
    .finally(() => {
      OSWindowProgressService.clear();
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
    const flashState = FlashStateModel.getFlashState();
    const isChecking = flashState.type === 'check';

    if (!FlashStateModel.isFlashing()) {
      return 'Flash!';
    }

    if (flashState.percentage === 0) {
      return 'Starting...';
    } else if (flashState.percentage === 100) {
      if (isChecking && SettingsModel.get('unmountOnSuccess')) {
        return 'Unmounting...';
      }

      return 'Finishing...';
    }

    if (isChecking) {
      return `${flashState.percentage}% Validating...`;
    }

    return `${flashState.percentage}%`;
  };

};
