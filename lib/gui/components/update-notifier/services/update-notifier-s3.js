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
const semver = require('semver');
const xml = require('xml2js');

module.exports = function($q, $http, UPDATE_NOTIFIER_URL) {

  /**
   * @summary Get the latest published Etcher version
   * @function
   * @public
   *
   * @description
   * This function performs its job by querying the publicily accessible
   * S3 bucket where we store the builds and uses the `node-semver` module
   * to determine which is the latest one.
   *
   * @fulfil {String} - latest version
   * @returns {Promise}
   *
   * @example
   * UpdateNotifierS3Service.getLatestVersion().then((latestVersion) => {
   *   console.log('The latest version is: ' + latestVersion);
   * });
   */
  this.getLatestVersion = () => {
    return $http.get(UPDATE_NOTIFIER_URL).then((response) => {
      return $q((resolve, reject) => {
        xml.parseString(response.data, (error, result) => {
          if (error) {
            return reject(error);
          }

          const bucketEntries = result.ListBucketResult.Contents;
          return resolve(_.reduce(bucketEntries, (latest, entry) => {
            const version = _.chain(entry.Key)
              .first()
              .split('/')
              .nth(1)
              .value();

            return semver.gt(version, latest) ? version : latest;

            // This is a good accumulator default value since
            // every version is semantically greater than this.
          }, '0.0.0'));

        });
      });
    });
  };

};
