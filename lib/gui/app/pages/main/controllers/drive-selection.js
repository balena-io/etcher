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

const _ = require('lodash')
const angular = require('angular')
const prettyBytes = require('pretty-bytes')
const store = require('../../../models/store')
// eslint-disable-next-line node/no-missing-require
const settings = require('../../../models/settings')
const selectionState = require('../../../models/selection-state')
const analytics = require('../../../modules/analytics')
const exceptionReporter = require('../../../modules/exception-reporter')
// eslint-disable-next-line node/no-missing-require
const utils = require('../../../../../gui/app/modules/utils')

module.exports = function (DriveSelectorService) {
  /**
   * @summary Get drive title based on device quantity
   * @function
   * @public
   *
   * @returns {String} - drives title
   *
   * @example
   * console.log(DriveSelectionController.getDrivesTitle())
   * > 'Multiple Drives (4)'
   */
  this.getDrivesTitle = () => {
    const drives = selectionState.getSelectedDrives()

    // eslint-disable-next-line no-magic-numbers
    if (drives.length === 1) {
      return _.head(drives).description || 'Untitled Device'
    }

    // eslint-disable-next-line no-magic-numbers
    if (drives.length === 0) {
      return 'No targets found'
    }

    return `${drives.length} Devices`
  }

  /**
   * @summary Get drive subtitle
   * @function
   * @public
   *
   * @returns {String} - drives subtitle
   *
   * @example
   * console.log(DriveSelectionController.getDrivesSubtitle())
   * > '32 GB'
   */
  this.getDrivesSubtitle = () => {
    const drive = selectionState.getCurrentDrive()

    if (drive) {
      return prettyBytes(drive.size)
    }

    return 'Please insert at least one target device'
  }

  /**
   * @summary Get drive list label
   * @function
   * @public
   *
   * @returns {String} - 'list' of drives separated by newlines
   *
   * @example
   * console.log(DriveSelectionController.getDriveListLabel())
   * > 'My Drive (/dev/disk1)\nMy Other Drive (/dev/disk2)'
   */
  this.getDriveListLabel = () => {
    return _.join(_.map(selectionState.getSelectedDrives(), (drive) => {
      return `${drive.description} (${drive.displayName})`
    }), '\n')
  }

  /**
   * @summary Open drive selector
   * @function
   * @public
   *
   * @example
   * DriveSelectionController.openDriveSelector();
   */
  this.openDriveSelector = () => {
    DriveSelectorService.open().then((drive) => {
      if (!drive) {
        return
      }

      selectionState.selectDrive(drive.device)

      analytics.logEvent('Select drive', {
        device: drive.device,
        unsafeMode: settings.get('unsafeMode') && !settings.get('disableUnsafeMode'),
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      })
    }).catch(exceptionReporter.report)
  }

  /**
   * @summary Reselect a drive
   * @function
   * @public
   *
   * @example
   * DriveSelectionController.reselectDrive();
   */
  this.reselectDrive = () => {
    this.openDriveSelector()
    analytics.logEvent('Reselect drive', {
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })
  }

  /**
   * @summary Get memoized selected drives
   * @function
   * @public
   *
   * @example
   * DriveSelectionController.getMemoizedSelectedDrives()
   */
  this.getMemoizedSelectedDrives = utils.memoize(selectionState.getSelectedDrives, angular.equals)

  /**
   * @summary Should the drive selection button be shown
   * @function
   * @public
   *
   * @returns {Boolean}
   *
   * @example
   * DriveSelectionController.shouldShowDrivesButton()
   */
  this.shouldShowDrivesButton = () => {
    return !settings.get('disableExplicitDriveSelection')
  }
}
