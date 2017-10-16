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
const EventEmitter = require('events').EventEmitter
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
 * @returns {EventEmitter}
 *
 * @example
 * const emitter = standard.scan({
 *   includeSystemDrives: true
 * })
 *
 * emitter.on('done', (drives) => {
 *   console.log(drives)
 * })
 *
 * emitter.on('error', (error) => {
 *   throw error
 * })
 */
exports.scan = (options = {}) => {
  const emitter = new EventEmitter()

  // eslint-disable-next-line lodash/prefer-lodash-method
  drivelist.listAsync().map((drive) => {
    drive.adaptor = exports.name

    // TODO: Find a better way to detect that a certain
    // block device is a compute module initialized
    // through usbboot.
    if (_.includes([ '0001', 'RPi-MSD- 0001', 'File-Stor Gadget', 'Linux File-Stor Gadget USB Device' ], drive.description)) {
      drive.description = 'Compute Module'
      drive.icon = 'raspberrypi'
      drive.system = false
    }

    return drive
  }).filter((drive) => {
    return options.includeSystemDrives || !drive.system
  }).then((drives) => {
    emitter.emit('done', drives)
  }).catch((error) => {
    emitter.emit('error', error)
  })

  return emitter
}
