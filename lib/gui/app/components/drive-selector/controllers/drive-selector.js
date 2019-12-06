/*
 * Copyright 2016 balena.io
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
const Bluebird = require('bluebird')
const constraints = require('../../../../../shared/drive-constraints')
const store = require('../../../models/store')
const analytics = require('../../../modules/analytics')
const availableDrives = require('../../../models/available-drives')
const selectionState = require('../../../models/selection-state')
const utils = require('../../../../../shared/utils')

module.exports = function (
  $q,
  $uibModalInstance,
  ConfirmModalService,
  OSOpenExternalService
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
    return $q.resolve(constraints.isDriveValid(drive, selectionState.getImage()))
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
          previouslySelected: selectionState.isCurrentDrive(drive.device),
          applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
          flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
        })

        selectionState.toggleDrive(drive.device)
      }

      return Bluebird.resolve()
    })
  }

  /**
   * @summary Prompt the user to install missing usbboot drivers
   * @function
   * @public
   *
   * @param {Object} drive - drive
   * @returns {Promise} - resolved promise
   *
   * @example
   * DriveSelectorController.installMissingDrivers({
   *   linkTitle: 'Go to example.com',
   *   linkMessage: 'Examples are great, right?',
   *   linkCTA: 'Call To Action',
   *   link: 'https://example.com'
   * });
   */
  this.installMissingDrivers = (drive) => {
    if (drive.link) {
      analytics.logEvent('Open driver link modal', {
        url: drive.link,
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      })

      return ConfirmModalService.show({
        confirmationLabel: 'Yes, continue',
        rejectionLabel: 'Cancel',
        title: drive.linkTitle,
        confirmButton: 'primary',
        message: drive.linkMessage || `Etcher will open ${drive.link} in your browser`
      }).then((shouldContinue) => {
        if (shouldContinue) {
          OSOpenExternalService.open(drive.link)
        }
      }).catch((error) => {
        analytics.logException(error)
      })
    }

    return Bluebird.resolve()
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

        analytics.logEvent('Drive selected (double click)', {
          applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
          flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
        })

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
