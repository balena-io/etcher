/*
 * Copyright 2017 resin.io
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

const debug = require('debug')('etcher:cli:diskpart')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const driveClean = require('win-drive-clean')

const DISKPART_DELAY = 2000
const DISKPART_RETRIES = 5

module.exports = {

  /**
   * @summary Clean a device's partition tables
   * @param {String} device - device path
   * @example
   * diskpart.clean('\\\\.\\PhysicalDrive2')
   *   .then(...)
   *   .catch(...)
   * @returns {Promise}
   */
  clean (device) {
    debug('clean', device)

    // NOTE: This is a noop on Linux & Mac OS at this time and
    // will always succeed without doing anything
    return retry(() => {
      return new Promise((resolve, reject) => {
        driveClean(device, (error) => {
          return error ? reject(error) : resolve()
        })
      }).delay(DISKPART_DELAY)
    }, {
      /* eslint-disable camelcase */
      max_tries: DISKPART_RETRIES
      /* eslint-enable camelcase */
    })
  }

}
