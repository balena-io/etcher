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

module.exports = function(SelectionStateModel, AnalyticsService, ErrorService, DriveSelectorService) {

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
        return;
      }

      SelectionStateModel.setDrive(drive.device);

      AnalyticsService.logEvent('Select drive', {
        device: drive.device
      });
    }).catch(ErrorService.reportException);
  };

  /**
   * @summary Reselect a drive
   * @function
   * @public
   *
   * @example
   * DriveSelectionController.reselectDrive();
   */
  this.reselectDrive = () => {
    this.openDriveSelector();
    AnalyticsService.logEvent('Reselect drive');
  };

};
