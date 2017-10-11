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

const Bluebird = require('bluebird')
const drivelist = Bluebird.promisifyAll(require('drivelist'))

/**
 * @summary The name of this adaptor
 * @public
 * @type {String}
 * @constant
 */
exports.name = 'standard'

/**
 * @summary Scan for block devices
 * @function
 * @public
 *
 * @param {Object} [options] - options
 * @param {Object} [options.includeSystemDrives=false] - include system drives
 * @fulfil {Object[]} - block devices
 * @returns {Promise}
 *
 * @example
 * standard.scan({
 *   includeSystemDrives: true
 * }).each((device) => {
 *   console.log(device)
 * })
 */
exports.scan = (options = {}) => {
  // eslint-disable-next-line lodash/prefer-lodash-method
  return drivelist.listAsync().filter((drive) => {
    return options.includeSystemDrives || !drive.system
  }).map((drive) => {
    drive.pending = false
    drive.adaptor = exports.name

    // TODO: Find a better way to detect that a certain
    // block device is a compute module initialized
    // through usbboot.
    if (drive.description === '0001') {
      drive.description = 'Compute Module'
      drive.icon = 'raspberrypi'
    }

    return drive
  })
}
