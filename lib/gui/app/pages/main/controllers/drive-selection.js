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
const settings = require('../../../models/settings')
const selectionState = require('../../../../../shared/models/selection-state')
const analytics = require('../../../modules/analytics')
const exceptionReporter = require('../../../modules/exception-reporter')

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
      return _.head(drives).description
    }

    return `${drives.length} Devices`
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
        unsafeMode: settings.get('unsafeMode')
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
    analytics.logEvent('Reselect drive')
  }
}
