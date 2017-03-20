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
const messages = require('../../../../shared/messages');
const constraints = require('../../../../shared/drive-constraints');

module.exports = function(
  $q,
  $uibModalInstance,
  DrivesModel,
  SelectionStateModel,
  WarningModalService,
  AnalyticsService
) {

  /**
   * @summary The drive selector state
   * @type {Object}
   * @public
   */
  this.state = SelectionStateModel;

  /**
   * @summary Static methods to check a drive's properties
   * @type {Object}
   * @public
   */
  this.constraints = constraints;

  /**
   * @summary The drives model
   * @type {Object}
   * @public
   *
   * @description
   * We expose the whole service instead of the `.drives`
   * property, which is the one we're interested in since
   * this allows the property to be automatically updated
   * when `DrivesModel` detects a change in the drives.
   */
  this.drives = DrivesModel;

  /**
   * @summary Determine if we can change a drive's selection state
   * @function
   * @private
   *
   * @param {Object} drive - drive
   * @returns {Promise}
   *
   * @example
   * DriveSelectorController.shouldChangeDriveSelectionState(drive)
   *    .then((shouldChangeDriveSelectionState) => {
   *        if (shouldChangeDriveSelectionState) doSomething();
   *    });
   */
  const shouldChangeDriveSelectionState = (drive) => {
    if (!constraints.isDriveValid(drive, SelectionStateModel.getImage())) {
      return $q.resolve(false);
    }

    if (constraints.isDriveSizeRecommended(drive, SelectionStateModel.getImage())) {
      return $q.resolve(true);
    }

    return WarningModalService.display({
      confirmationLabel: 'Yes, continue',
      description: [
        messages.warning.unrecommendedDriveSize({
          image: SelectionStateModel.getImage(),
          drive
        }),
        'Are you sure you want to continue?'
      ].join(' ')
    });
  };

  /**
   * @summary Toggle a drive selection
   * @function
   * @public
   *
   * @param {Object} drive - drive
   * @returns {Promise} - resolved promise
   *
   * @example
   * DriveSelectorController.toggleDrive({
   *   device: '/dev/disk2',
   *   size: 999999999,
   *   name: 'Cruzer USB drive'
   * });
   */
  this.toggleDrive = (drive) => {

    AnalyticsService.logEvent('Toggle drive', {
      drive,
      previouslySelected: SelectionStateModel.isCurrentDrive(drive.device)
    });

    return shouldChangeDriveSelectionState(drive).then((canChangeDriveSelectionState) => {
      if (canChangeDriveSelectionState) {
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

  /**
   * @summary Select a drive and close the modal
   * @function
   * @public
   *
   * @param {Object} drive - drive
   * @returns {Promise} - resolved promise
   *
   * @example
   * DriveSelectorController.selectDriveAndClose({
   *   device: '/dev/disk2',
   *   size: 999999999,
   *   name: 'Cruzer USB drive'
   * });
   */
  this.selectDriveAndClose = (drive) => {
    return shouldChangeDriveSelectionState(drive).then((canChangeDriveSelectionState) => {
      if (canChangeDriveSelectionState) {
        SelectionStateModel.setDrive(drive.device);

        AnalyticsService.logEvent('Drive selected (double click)');

        this.closeModal();
      }
    });
  };

  /**
   * @summary Get drive and image compatibility status object
   * @function
   * @public
   *
   * @description
   * Given an image and a drive, return their compatibility status object
   * containing the status type (ERROR, WARNING, and OK), and accompanying
   * status message.
   * Almost just a synonym of its namesake, the difference is that the image
   * argument is implicit here for the sake of shortening.
   *
   * @param {Object} drive - drive
   * @returns {Object} compatibility status object
   *
   * @example
   * const { type, message } = DriveSelectorController.getDriveImageCompatibilityStatus(drive);
   */
  this.getDriveImageCompatibilityStatus = (drive) => {
    return this.constraints.getDriveImageCompatibilityStatus(drive, this.state.getImage());
  };

};
