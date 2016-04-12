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

module.exports = function(SelectionStateModel) {
  let self = this;

  /**
   * @summary Toggle select drive
   * @function
   * @public
   *
   * @param {Object} drive - drive
   *
   * @example
   * DriveSelectorController.toggleSelectDrive({ drive });
   */
  this.toggleSelectDrive = function(drive) {
    if (this.isSelectedDrive(drive)) {
      SelectionStateModel.removeDrive();
    } else {
      SelectionStateModel.setDrive(drive);
    }
  };

  /**
   * @summary Check if a drive is the selected one
   * @function
   * @public
   *
   * @param {Object} drive - drive
   * @returns {Boolean} whether the drive is selected
   *
   * @example
   * if (DriveSelectorController.isSelectedDrive({ drive })) {
   *   console.log('The drive is selected!');
   * }
   */
  this.isSelectedDrive = function(drive) {
    if (!_.has(drive, 'device')) {
      return false;
    }

    return drive.device === _.get(self.getSelectedDrive(), 'device');
  };

  /**
   * @summary Get selected drive
   * @function
   * @public
   *
   * @returns {Object} selected drive
   *
   * @example
   * const drive = DriveSelectorStateService.getSelectedDrive();
   */
  this.getSelectedDrive = SelectionStateModel.getDrive;

};
