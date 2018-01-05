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

const _ = require('lodash')
const Bluebird = require('bluebird')
const EventEmitter = require('events')
const drivelist = Bluebird.promisifyAll(require('drivelist'))

/**
 * @summary StandardAdapter
 * @class
 */
class StandardAdapter extends EventEmitter {
  /**
   * @summary StandardAdapter constructor
   * @class
   * @example
   * const adapter = new StandardAdapter()
   */
  constructor () {
    super()

    /** @type {String} Adapter name */
    this.id = this.constructor.id

    this.devices = []
    this.on('devices', (devices) => {
      this.devices = devices
    })
  }

  /**
   * @summary Scan for block devices
   * @public
   *
   * @param {Object} [options] - options
   * @param {Object} [options.includeSystemDrives=false] - include system drives
   * @param {Function} [callback] - optional callback
   * @returns {StandardAdapter}
   *
   * @example
   * adapter.scan({
   *   includeSystemDrives: true
   * }, (error, devices) => {
   *   // ...
   * })
   */
  scan (options = {}, callback) {
    // eslint-disable-next-line lodash/prefer-lodash-method
    drivelist.listAsync().map((drive) => {
      drive.adapter = this.id

      // TODO: Find a better way to detect that a certain
      // block device is a compute module initialized
      // through usbboot.
      if (_.includes([ '0001', 'RPi-MSD- 0001', 'File-Stor Gadget', 'Linux File-Stor Gadget USB Device' ], drive.description)) {
        drive.description = 'Compute Module'
        drive.icon = 'raspberrypi'
        drive.isSystem = false
      }

      return drive
    }).catch((error) => {
      this.emit('error', error)
      callback && callback(error)
    }).filter((drive) => {
      return !drive.error && (options.includeSystemDrives || !drive.isSystem)
    }).map((drive) => {
      drive.displayName = drive.device
      if (/PhysicalDrive/i.test(drive.device) && drive.mountpoints.length) {
        drive.displayName = _.map(drive.mountpoints, 'path').join(', ')
      }
      return drive
    }).then((drives) => {
      this.emit('devices', drives)
      callback && callback(null, drives)
    })

    return this
  }
}

/**
 * @summary The name of this adapter
 * @public
 * @type {String}
 * @constant
 */
StandardAdapter.id = 'standard'

// Exports
module.exports = StandardAdapter
