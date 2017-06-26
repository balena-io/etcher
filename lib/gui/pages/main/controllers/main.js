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

const settings = require('../../../models/settings');
const flashState = require('../../../models/flash-state');
const analytics = require('../../../modules/analytics');
const exception = require('../../../modules/exception');
const availableDrives = require('../../../models/available-drives');
const selectionState = require('../../../models/selection-state');

module.exports = function(
  TooltipModalService,
  OSOpenExternalService
) {

  // Expose several modules to the template for convenience
  this.selection = selectionState;
  this.drives = availableDrives;
  this.state = flashState;
  this.settings = settings;
  this.external = OSOpenExternalService;

  /**
   * @summary Determine if the drive step should be disabled
   * @function
   * @public
   *
   * @returns {Boolean} whether the drive step should be disabled
   *
   * @example
   * if (MainController.shouldDriveStepBeDisabled()) {
   *   console.log('The drive step should be disabled');
   * }
   */
  this.shouldDriveStepBeDisabled = () => {
    return !selectionState.hasImage();
  };

  /**
   * @summary Determine if the flash step should be disabled
   * @function
   * @public
   *
   * @returns {Boolean} whether the flash step should be disabled
   *
   * @example
   * if (MainController.shouldFlashStepBeDisabled()) {
   *   console.log('The flash step should be disabled');
   * }
   */
  this.shouldFlashStepBeDisabled = () => {
    return !selectionState.hasDrive() || this.shouldDriveStepBeDisabled();
  };

  /**
   * @summary Display a tooltip with the selected image details
   * @function
   * @public
   *
   * @returns {Promise}
   *
   * @example
   * MainController.showSelectedImageDetails()
   */
  this.showSelectedImageDetails = () => {
    analytics.logEvent('Show selected image tooltip', {
      imagePath: selectionState.getImagePath()
    });

    return TooltipModalService.show({
      title: 'Image File Name',
      message: selectionState.getImagePath()
    }).catch(exception.report);
  };

};
