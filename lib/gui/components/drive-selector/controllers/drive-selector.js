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

const _ = require('lodash');

module.exports = function($uibModalInstance, DrivesModel, SelectionStateModel, WarningModalService) {

  /**
   * @summary The drive selector state
   * @property
   * @type Object
   */
  this.state = SelectionStateModel;

  /**
   * @summary The drives model
   * @property
   * @type Object
   *
   * @description
   * We expose the whole service instead of the `.drives`
   * property, which is the one we're interested in since
   * this allows the property to be automatically updated
   * when `DrivesModel` detects a change in the drives.
   */
  this.drives = DrivesModel;

  /**
   * @summary Toggle a drive selection
   * @function
   * @public
   *
   * @param {Object} drive - drive
   *
   * @example
   * DriveSelectorController.toggleDrive({
   *   device: '/dev/disk2',
   *   size: 999999999,
   *   name: 'Cruzer USB drive'
   * });
   */
  this.toggleDrive = (drive) => {
    if (!SelectionStateModel.isDriveValid(drive)) {
      return;
    }

    if (_.some([
      SelectionStateModel.isDriveSizeRecommended(drive),
      SelectionStateModel.isCurrentDrive(drive.device)
    ])) {
      SelectionStateModel.toggleSetDrive(drive.device);
      return;
    }

    WarningModalService.display([
      `This image recommends a ${SelectionStateModel.getImageRecommendedDriveSize()}`,
      `bytes drive, however ${drive.device} is only ${drive.size} bytes.`,
      'Are you sure you want to continue?'
    ].join(' ')).then((userAccepted) => {
      if (userAccepted) {
        SelectionStateModel.toggleSetDrive(drive.device);
      }
    });
  };

  /**
   * @summary Close the modal and resolve the selected drive
   * @function
   * @public
   *
   * @example
   * DriveSelectorController.closeModal();
   */
  this.closeModal = () => {
    const selectedDrive = SelectionStateModel.getDrive();

    // Sanity check to cover the case where a drive is selected,
    // the drive is then unplugged from the computer and the modal
    // is resolved with a non-existent drive.
    if (!selectedDrive || !_.includes(this.drives.getDrives(), selectedDrive)) {
      $uibModalInstance.close();
    } else {
      $uibModalInstance.close(selectedDrive);
    }

  };

};
