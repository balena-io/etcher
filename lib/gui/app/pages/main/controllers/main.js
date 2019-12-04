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

const path = require('path')
const store = require('../../../models/store')
const settings = require('../../../models/settings')
const flashState = require('../../../models/flash-state')
const analytics = require('../../../modules/analytics')
const exceptionReporter = require('../../../modules/exception-reporter')
const availableDrives = require('../../../models/available-drives')
const selectionState = require('../../../models/selection-state')
const driveConstraints = require('../../../../../shared/drive-constraints')
const messages = require('../../../../../shared/messages')
const prettyBytes = require('pretty-bytes')

module.exports = function (
  OSOpenExternalService,
  $filter,
  $scope
) {
  // Expose several modules to the template for convenience
  this.selection = selectionState
  this.drives = availableDrives
  this.state = flashState
  this.settings = settings
  this.external = OSOpenExternalService
  this.constraints = driveConstraints
  this.progressMessage = messages.progress
  this.isWebviewShowing = Boolean(store.getState().toJS().isWebviewShowing)

  // Trigger an update if the store changes
  store.observe(() => {
    if (!$scope.$$phase) {
      $scope.$apply()
    }
  })

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
    return !selectionState.hasImage()
  }

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
    return !selectionState.hasDrive() || this.shouldDriveStepBeDisabled()
  }

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
    const drives = this.selection.getSelectedDrives()

    /* eslint-disable no-magic-numbers */
    if (drives.length === 1) {
      return drives[0].description || 'Untitled Device'
    }
    /* eslint-enable no-magic-numbers */

    // eslint-disable-next-line no-magic-numbers
    if (drives.length === 0) {
      return 'No targets found'
    }

    return `${drives.length} Targets`
  }

  /**
   * @summary Get drive subtitle
   * @function
   * @public
   *
   * @returns {String} - drives subtitle
   *
   * @example
   * console.log(MainController.getDrivesSubtitle())
   * > '32 GB'
   */
  this.getDrivesSubtitle = () => {
    const drive = this.selection.getCurrentDrive()

    if (drive) {
      return prettyBytes(drive.size)
    }

    return 'Please insert at least one target device'
  }

  /**
   * @summary Get the basename of the selected image
   * @function
   * @public
   *
   * @returns {String} basename of the selected image
   *
   * @example
   * const imageBasename = ImageSelectionController.getImageBasename();
   */
  this.getImageBasename = () => {
    if (!this.selection.hasImage()) {
      return ''
    }

    return path.basename(this.selection.getImagePath())
  }

  this.setWebviewShowing = (data) => {
    this.isWebviewShowing = data
    store.dispatch({
      type: 'SET_WEBVIEW_SHOWING_STATUS',
      data: Boolean(data)
    })
  }

  this.getDriveTitle = () => {
    /* eslint-disable no-magic-numbers */
    const driveTitleRaw = (this.selection.getSelectedDevices().length === 1)
      ? this.getDrivesSubtitle()
      : `${this.selection.getSelectedDevices().length} Targets`
    return $filter('middleEllipsis:20')(driveTitleRaw)
  }
}
