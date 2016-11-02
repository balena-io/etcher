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

module.exports = function($uibModalInstance, SettingsModel) {

  // We update this value in this controller since its the only place
  // where we can be sure the modal was really presented to the user.
  // If the controller is instantiated, means the modal was shown.
  // Compare that to `UpdateNotifierService.notify()`, which could
  // have been called, but the modal could have failed to be shown.
  SettingsModel.set('lastUpdateNotify', Date.now());

  /**
   * @summary Settings model
   * @type Object
   * @public
   */
  this.settings = SettingsModel;

  /**
   * @summary Close the modal
   * @function
   * @public
   *
   * @example
   * UpdateNotifierController.closeModal();
   */
  this.closeModal = () => {
    $uibModalInstance.dismiss();
  };

};
