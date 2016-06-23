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

const semver = require('semver');

module.exports = function($uibModal, UPDATE_NOTIFIER_SLEEP_TIME, ManifestBindService, UpdateNotifierS3Service, SettingsModel) {

  /**
   * @summary Check if the current version is the latest version
   * @function
   * @public
   *
   * @fulfil {Boolean} - is latest version
   * @returns {Promise}
   *
   * @example
   * UpdateNotifierService.isLatestVersion().then((isLatestVersion) => {
   *   if (!isLatestVersion) {
   *     console.log('There is an update available');
   *   }
   * });
   */
  this.isLatestVersion = () => {
    return UpdateNotifierS3Service.getLatestVersion().then((version) => {
      return semver.gte(ManifestBindService.get('version'), version);
    });
  };

  /**
   * @summary Determine if its time to check for updates
   * @function
   * @public
   *
   * @returns {Boolean} should check for updates
   *
   * @example
   * if (UpdateNotifierService.shouldCheckForUpdates()) {
   *   console.log('We should check for updates!');
   * }
   */
  this.shouldCheckForUpdates = () => {
    const lastUpdateNotify = SettingsModel.data.lastUpdateNotify;

    if (!SettingsModel.data.sleepUpdateCheck || !lastUpdateNotify) {
      return true;
    }

    if (lastUpdateNotify - Date.now() > UPDATE_NOTIFIER_SLEEP_TIME) {
      SettingsModel.data.sleepUpdateCheck = false;
      return true;
    }

    return false;
  };

  /**
   * @summary Open the update notifier widget
   * @function
   * @public
   *
   * @returns {Promise}
   *
   * @example
   * UpdateNotifierService.notify();
   */
  this.notify = () => {
    return $uibModal.open({
      animation: true,
      templateUrl: './components/update-notifier/templates/update-notifier-modal.tpl.html',
      controller: 'UpdateNotifierController as modal',
      size: 'update-notifier'
    }).result;
  };

};
