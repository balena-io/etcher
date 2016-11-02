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

const semver = require('semver');
const etcherLatestVersion = require('etcher-latest-version');

module.exports = function($http, $q, ModalService, UPDATE_NOTIFIER_SLEEP_TIME, ManifestBindService, SettingsModel) {

  /**
   * @summary Get the latest available Etcher version
   * @function
   * @private
   *
   * @fulfil {String} - latest version
   * @returns {Promise}
   *
   * @example
   * UpdateNotifierService.getLatestVersion().then((latestVersion) => {
   *   console.log(`The latest version is: ${latestVersion}`);
   * });
   */
  this.getLatestVersion = () => {
    return $q((resolve, reject) => {
      return etcherLatestVersion((url, callback) => {
        return $http.get(url).then((response) => {
          return callback(null, response.data);
        }).catch((error) => {
          return callback(error);
        });
      }, (error, latestVersion) => {
        if (error) {
          return reject(error);
        }

        return resolve(latestVersion);
      });
    });
  };

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
    return this.getLatestVersion().then((version) => {
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
    const lastUpdateNotify = SettingsModel.get('lastUpdateNotify');

    if (!SettingsModel.get('sleepUpdateCheck') || !lastUpdateNotify) {
      return true;
    }

    if (lastUpdateNotify - Date.now() > UPDATE_NOTIFIER_SLEEP_TIME) {
      SettingsModel.set('sleepUpdateCheck', false);
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
    return ModalService.open({
      template: './components/update-notifier/templates/update-notifier-modal.tpl.html',
      controller: 'UpdateNotifierController as modal',
      size: 'update-notifier'
    }).result;
  };

};
