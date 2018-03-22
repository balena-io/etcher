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

const angular = require('angular')
const _ = require('lodash')
const messages = require('../../../../../shared/messages')
const constraints = require('../../../../../shared/drive-constraints')
const analytics = require('../../../modules/analytics')
const availableDrives = require('../../../../../shared/models/available-drives')
const selectionState = require('../../../../../shared/models/selection-state')
const utils = require('../../../../../shared/utils')

module.exports = function (
  $q,
  $uibModalInstance,
  WarningModalService
) {
  /**
   * @summary The drive selector state
   * @type {Object}
   * @public
   */
  this.state = selectionState

  /**
   * @summary Static methods to check a drive's properties
   * @type {Object}
   * @public
   */
  this.constraints = constraints

  /**
   * @summary The drives model
   * @type {Object}
   * @public
   *
   * @description
   * We expose the whole service instead of the `.drives`
   * property, which is the one we're interested in since
   * this allows the property to be automatically updated
   * when `availableDrives` detects a change in the drives.
   */
  this.drives = availableDrives

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
    if (!constraints.isDriveValid(drive, selectionState.getImage())) {
      return $q.resolve(false)
    }

    if (!constraints.isDriveSizeRecommended(drive, selectionState.getImage())) {
      return WarningModalService.display({
        confirmationLabel: 'Yes, continue',
        description: [
          messages.warning.unrecommendedDriveSize(selectionState.getImage(), drive),
          'Are you sure you want to continue?'
        ].join(' ')
      })
    }

    if (constraints.isDriveSizeLarge(drive)) {
      return WarningModalService.display({
        confirmationLabel: 'Yes, continue',
        description: messages.warning.largeDriveSize(drive)
      })
    }

    return $q.resolve(true)
  }

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
    return shouldChangeDriveSelectionState(drive).then((canChangeDriveSelectionState) => {
      if (canChangeDriveSelectionState) {
        analytics.logEvent('Toggle drive', {
          drive,
          previouslySelected: selectionState.isCurrentDrive(drive.device)
        })

        selectionState.toggleDrive(drive.device)
      }
    })
  }

  /**
   * @summary Close the modal and resolve the selected drive
   * @function
   * @public
   *
   * @example
   * DriveSelectorController.closeModal();
   */
  this.closeModal = () => {
    const selectedDrive = selectionState.getCurrentDrive()

    // Sanity check to cover the case where a drive is selected,
    // the drive is then unplugged from the computer and the modal
    // is resolved with a non-existent drive.
    if (!selectedDrive || !_.includes(this.drives.getDrives(), selectedDrive)) {
      $uibModalInstance.close()
    } else {
      $uibModalInstance.close(selectedDrive)
    }
  }

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
        selectionState.selectDrive(drive.device)

        analytics.logEvent('Drive selected (double click)')

        this.closeModal()
      }
    })
  }

  /**
   * @summary Memoized getDrives function
   * @function
   * @public
   *
   * @returns {Array<Object>} - memoized list of drives
   *
   * @example
   * const drives = DriveSelectorController.getDrives()
   * // Do something with drives
   */
  this.getDrives = utils.memoize(this.drives.getDrives, angular.equals)

  /**
   * @summary Get a drive's compatibility status object(s)
   * @function
   * @public
   *
   * @description
   * Given a drive, return its compatibility status with the selected image,
   * containing the status type (ERROR, WARNING), and accompanying
   * status message.
   *
   * @returns {Object[]} list of objects containing statuses
   *
   * @example
   * const statuses = DriveSelectorController.getDriveStatuses(drive);
   *
   * for ({ type, message } of statuses) {
   *   // do something
   * }
   */
  this.getDriveStatuses = utils.memoize((drive) => {
    return this.constraints.getDriveImageCompatibilityStatuses(drive, this.state.getImage())
  }, angular.equals)

  /**
   * @summary Keyboard event drive toggling
   * @function
   * @public
   *
   * @description
   * Keyboard-event specific entry to the toggleDrive function.
   *
   * @param {Object} drive - drive
   * @param {Object} $event - event
   *
   * @example
   * <div tabindex="1" ng-keypress="this.keyboardToggleDrive(drive, $event)">
   *   Tab-select me and press enter or space!
   * </div>
   */
  this.keyboardToggleDrive = (drive, $event) => {
    console.log($event.keyCode)
    const ENTER = 13
    const SPACE = 32
    if (_.includes([ ENTER, SPACE ], $event.keyCode)) {
      this.toggleDrive(drive)
    }
  }
}
