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

const _ = require('lodash');
const semver = require('semver');
const etcherLatestVersion = require('etcher-latest-version');
const units = require('../../../../shared/units');

module.exports = function($http, $q, ModalService, UPDATE_NOTIFIER_SLEEP_DAYS, ManifestBindService, SettingsModel) {

  /**
   * @summary The current application version
   * @constant
   * @private
   * @type {String}
   */
  const CURRENT_VERSION = ManifestBindService.get('version');

  /**
   * @summary Get the latest available Etcher version
   * @function
   * @private
   * @description
   * We assume the received latest version number will not increase
   * while Etcher is running and memoize it
   *
   * @fulfil {String} - latest version
   * @returns {Promise}
   *
   * @example
   * UpdateNotifierService.getLatestVersion().then((latestVersion) => {
   *   console.log(`The latest version is: ${latestVersion}`);
   * });
   */
  this.getLatestVersion = _.memoize(() => {
    return $q((resolve, reject) => {
      return etcherLatestVersion((url, callback) => {
        return $http.get(url).then((response) => {
          return callback(null, response.data);
        }).catch((error) => {
          return callback(error);
        });
      }, (error, latestVersion) => {
        if (error) {

          // The error status equals this number if the request
          // couldn't be made successfuly, for example, because
          // of a timeout on an unstable network connection.
          const ERROR_CODE_UNSUCCESSFUL_REQUEST = -1;

          if (error.status === ERROR_CODE_UNSUCCESSFUL_REQUEST) {
            return resolve(CURRENT_VERSION);
          }

          return reject(error);
        }

        return resolve(latestVersion);
      });
    });

  // Arbitrary identifier for the memoization function
  }, _.constant('latest-version'));

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
      return semver.gte(CURRENT_VERSION, version);
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

    if (lastUpdateNotify - Date.now() > units.daysToMilliseconds(UPDATE_NOTIFIER_SLEEP_DAYS)) {
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
    return this.getLatestVersion().then((version) => {
      return ModalService.open({
        template: './components/update-notifier/templates/update-notifier-modal.tpl.html',
        controller: 'UpdateNotifierController as modal',
        size: 'update-notifier',
        resolve: {
          options: _.constant({
            version
          })
        }
      }).result;
    });
  };

};
