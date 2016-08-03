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

const _ = require('lodash');

module.exports = function(
  $state,
  DriveScannerService,
  SelectionStateModel,
  FlashStateModel,
  SettingsModel,
  SupportedFormatsModel,
  DrivesModel,
  ImageWriterService,
  AnalyticsService,
  ErrorService,
  DriveSelectorService,
  TooltipModalService,
  OSWindowProgressService,
  OSNotificationService,
  OSDialogService,
  OSOpenExternalService
) {

  this.formats = SupportedFormatsModel;
  this.selection = SelectionStateModel;
  this.drives = DrivesModel;
  this.state = FlashStateModel;
  this.settings = SettingsModel;
  this.tooltipModal = TooltipModalService;

  this.getProgressButtonLabel = () => {
    const flashState = this.state.getFlashState();

    if (!this.state.isFlashing()) {
      return 'Flash!';
    }

    if (flashState.percentage === 100) {
      if (flashState.type === 'check' && this.settings.get('unmountOnSuccess')) {
        return 'Unmounting...';
      }

      return 'Finishing...';
    }

    if (flashState.percentage === 0) {
      return 'Starting...';
    }

    if (flashState.type === 'check') {
      return `${flashState.percentage}% Validating...`;
    }

    return `${flashState.percentage}%`;
  };

  this.selectImage = (image) => {
    if (!SupportedFormatsModel.isSupportedImage(image.path)) {
      OSDialogService.showError('Invalid image', `${image.path} is not a supported image type.`);
      AnalyticsService.logEvent('Invalid image', image);
      return;
    }

    this.selection.setImage(image);
    AnalyticsService.logEvent('Select image', _.omit(image, 'logo'));
  };

  this.openImageUrl = () => {
    const imageUrl = this.selection.getImageUrl();

    if (imageUrl) {
      OSOpenExternalService.open(imageUrl);
    }
  };

  this.openImageSelector = () => {
    return OSDialogService.selectImage().then((image) => {

      // Avoid analytics and selection state changes
      // if no file was resolved from the dialog.
      if (!image) {
        return;
      }

      this.selectImage(image);
    }).catch(ErrorService.reportException);
  };

  this.selectDrive = (drive) => {
    if (!drive) {
      return;
    }

    this.selection.setDrive(drive.device);

    AnalyticsService.logEvent('Select drive', {
      device: drive.device
    });
  };

  this.openDriveSelector = () => {
    DriveSelectorService.open()
      .then(this.selectDrive)
      .catch(ErrorService.reportException);
  };

  this.reselectImage = () => {
    if (FlashStateModel.isFlashing()) {
      return;
    }

    // Reselecting an image automatically
    // de-selects the current drive, if any.
    // This is made so the user effectively
    // "returns" to the first step.
    this.selection.clear();

    this.openImageSelector();
    AnalyticsService.logEvent('Reselect image');
  };

  this.reselectDrive = () => {
    if (FlashStateModel.isFlashing()) {
      return;
    }

    this.openDriveSelector();
    AnalyticsService.logEvent('Reselect drive');
  };

  this.restartAfterFailure = () => {
    this.selection.clear({
      preserveImage: true
    });

    FlashStateModel.resetState();
    AnalyticsService.logEvent('Restart after failure');
  };

  this.flash = (image, drive) => {

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

    return ImageWriterService.flash(image, drive).then(() => {
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

};
