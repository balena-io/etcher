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
const prettyBytes = require('pretty-bytes')
const messages = require('../../../../shared/messages')
const constraints = require('../../../../shared/drive-constraints')
const analytics = require('../../../modules/analytics')
const availableDrives = require('../../../../shared/models/available-drives')
const selectionState = require('../../../../shared/models/selection-state')

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
   * @summary Determine if we can change the drives' selection state
   * @function
   * @private
   *
   * @param {Object[]} drives - drives
   * @returns {Promise}
   *
   * @example
   * DriveSelectorController.shouldChangeDriveSelectionState(drive)
   *    .then((shouldChangeDriveSelectionState) => {
   *        if (shouldChangeDriveSelectionState) doSomething();
   *    });
   */
  const shouldChangeDriveSelectionState = (drives) => {
    const image = selectionState.getImage()

    const validDrives = _.filter(drives, (drive) => {
      return constraints.isDriveValid(drive, image)
    })
    const recommendedSizeDrives = _.filter(validDrives, (drive) => {
      return constraints.isDriveSizeRecommended(drive, image)
    })

    if (recommendedSizeDrives.length === validDrives.length) {
      return $q.resolve(recommendedSizeDrives)
    }

    // FIXME silly temporary hacks in block below
    const unrecommendedSizeDrives = _.difference(recommendedSizeDrives, validDrives)
    return WarningModalService.display({
      confirmationLabel: 'Yes, continue',
      description: [
        messages.warning.unrecommendedDriveSize({
          image: _.assign({}, image, {
            prettyRecommendedDriveSize: prettyBytes(image.recommendedDriveSize)
          }),
          drive: _.assign({}, _.head(unrecommendedSizeDrives), {
            prettySize: prettyBytes(_.head(unrecommendedSizeDrives).size)
          })
        }),
        'Are you sure you want to continue?'
      ].join(' ')
    }).then((answer) => {
      if (answer) {
        return recommendedSizeDrives
      }

      return []
    })
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
  this.toggleDrive = (drive, $event) => {
    analytics.logEvent('Toggle drive', {
      drive,
      previouslySelected: selectionState.isCurrentDrive(drive.device)
    })

    let drives = []
    // Example support for range selection with Shift key
    if ($event.shiftKey) {
      const lastDrive = _.last(selectionState.getSelectedDrives())
      const allDrives = availableDrives.getDrives()
      const allDevices = _.map(allDrives, 'device')
      const toIndex = _.indexOf(allDevices, drive.device)
      const fromIndex = _.indexOf(allDevices, lastDrive.device)
      const INCLUSIVE_SLICE = 1

      drives = _.slice(allDrives, Math.min(toIndex, fromIndex), Math.max(toIndex, fromIndex) + INCLUSIVE_SLICE)
      console.log(JSON.stringify(_.map(drives, 'device')))
    } else {
      drives = [ drive ]
    }

    return shouldChangeDriveSelectionState(drives).then((acceptedDrives) => {
      console.log(JSON.stringify(_.map(acceptedDrives, 'device')))
      const changer = $event.shiftKey ? selectionState.addDrive : selectionState.toggleDrive
      _.forEach(acceptedDrives, (acceptedDrive) => {
        changer(acceptedDrive.device)
      })
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
        selectionState.setDrive(drive.device)

        analytics.logEvent('Drive selected (double click)')

        this.closeModal()
      }
    })
  }

  /**
   * @summary Memoize ImmutableJS list reference
   * @function
   * @private
   *
   * @description
   * This workaround is needed to avoid AngularJS from getting
   * caught in an infinite digest loop when using `ngRepeat`
   * over a function that returns a mutable version of an
   * ImmutableJS object.
   *
   * The problem is that every time you call `myImmutableObject.toJS()`
   * you will get a new object, whose reference is different from
   * the one you previously got, even if the data is exactly the same.
   *
   * @param {Function} func - function that returns an ImmutableJS list
   * @returns {Function} memoized function
   *
   * @example
   * const getList = () => {
   *   return Store.getState().toJS().myList;
   * };
   *
   * const memoizedFunction = memoizeImmutableListReference(getList);
   */
  this.memoizeImmutableListReference = (func) => {
    let previousTuples = []

    return (...restArgs) => {
      let areArgsInTuple = false
      let state = Reflect.apply(func, this, restArgs)

      previousTuples = _.map(previousTuples, ([ oldArgs, oldState ]) => {
        if (angular.equals(oldArgs, restArgs)) {
          areArgsInTuple = true

          if (angular.equals(state, oldState)) {
            // Use the previously memoized state for this argument
            state = oldState
          }

          // Update the tuple state
          return [ oldArgs, state ]
        }

        // Return the tuple unchanged
        return [ oldArgs, oldState ]
      })

      // Add the state associated with these args to be memoized
      if (!areArgsInTuple) {
        previousTuples.push([ restArgs, state ])
      }

      return state
    }
  }

  this.getDrives = this.memoizeImmutableListReference(() => {
    return this.drives.getDrives()
  })

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
  this.getDriveStatuses = this.memoizeImmutableListReference((drive) => {
    return this.constraints.getDriveImageCompatibilityStatuses(drive, this.state.getImage())
  })
}
