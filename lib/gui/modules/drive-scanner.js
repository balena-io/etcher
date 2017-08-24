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

'use strict'

const EventEmitter = require('events').EventEmitter
const Bluebird = require('bluebird')
const fs = require('fs')
const path = require('path')
const settings = require('../models/settings')
const sdk = require('../../shared/sdk')

/**
 * @summary Time to wait between scans
 * @type {Number}
 * @constant
 */
const DRIVE_SCANNER_INTERVAL_MS = 2000

/**
 * @summary Scanner event emitter singleton instance
 * @type {Object}
 * @constant
 */
const emitter = new EventEmitter()

/*
 * This service emits the following events:
 *
 * - `drives (Object[])`
 * - `error (Error)`
 *
 * For example:
 *
 * ```
 * driveScanner.on('drives', (drives) => {
 *   console.log(drives);
 * });
 *
 * driveScanner.on('error', (error) => {
 *   throw error;
 * });
 * ```
 */

/**
 * @summary The Etcher "blobs" directory path
 * @type {String}
 * @constant
 */
const BLOBS_DIRECTORY = path.join(__dirname, '..', '..', 'blobs')

/**
 * @summary The usbboot "bootcode.bin" buffer
 * @type {Buffer}
 * @constant
 */
const USBBOOT_BOOTCODE_BIN_BUFFER = fs.readFileSync(
  path.join(BLOBS_DIRECTORY, 'usbboot', 'bootcode.bin'))

/**
 * @summary The usbboot "start.elf" buffer
 * @type {Buffer}
 * @constant
 */
const USBBOOT_START_ELF_BUFFER = fs.readFileSync(
  path.join(BLOBS_DIRECTORY, 'usbboot', 'start.elf'))

/**
 * @summary Flag to control scanning status
 * @type {Boolean}
 */
let scanning = false

/**
 * @summary Start the scanning loop
 * @function
 * @private
 *
 * @description
 * This function emits `drives` or `error` events
 * using the event emitter singleton instance.
 *
 * @returns {Promise}
 *
 * @example
 * scanning = true
 * scan()
 */
const scan = () => {
  if (!scanning) {
    return Bluebird.resolve()
  }

  return sdk.scan({
    standard: {
      includeSystemDrives: settings.get('unsafeMode')
    },
    usbboot: {
      files: {
        'bootcode.bin': USBBOOT_BOOTCODE_BIN_BUFFER,
        'start.elf': USBBOOT_START_ELF_BUFFER
      }
    }
  }).then((drives) => {
    emitter.emit('drives', drives)
  }).catch((error) => {
    emitter.emit('error', error)
  }).finally(() => {
    if (!scanning) {
      return Bluebird.resolve()
    }

    return Bluebird
      .delay(DRIVE_SCANNER_INTERVAL_MS)
      .then(scan)
  })
}

/**
 * @summary Start scanning drives
 * @function
 * @public
 *
 * @example
 * driveScanner.start();
 */
emitter.start = () => {
  if (!scanning) {
    scanning = true
    scan()
  }
}

/**
 * @summary Stop scanning drives
 * @function
 * @public
 *
 * @example
 * driveScanner.stop();
 */
emitter.stop = () => {
  scanning = false
}

module.exports = emitter
