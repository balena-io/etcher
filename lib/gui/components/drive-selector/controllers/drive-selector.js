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

module.exports = function($uibModalInstance, DrivesModel, SelectionStateModel) {

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

      $uibModalInstance.dismiss();
    } else {
      $uibModalInstance.close(selectedDrive);
    }

  };

};
