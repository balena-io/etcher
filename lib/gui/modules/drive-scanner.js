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

const Rx = require('rx')
const _ = require('lodash')
const EventEmitter = require('events').EventEmitter
const drivelist = require('drivelist')
const settings = require('../models/settings')
const usbboot = require('../../shared/sdk/usbboot')

const DRIVE_SCANNER_INTERVAL_MS = 2000
const DRIVE_SCANNER_FIRST_SCAN_DELAY_MS = 0
const emitter = new EventEmitter()

/* eslint-disable lodash/prefer-lodash-method */

/**
 * @summary
 *
 * @param {Function} callback - two argument function callback of (err, result)
 *
 * @example
 */
const lister = (callback) => {
  drivelist.list((driveError, drives) => {
    if (driveError) {
      return callback(driveError)
    }

    const typeDrives = _.map(drives, (drive) => {
      return _.assign({}, drive, {
        type: 'BLOCK_DEVICE'
      })
    })

    return usbboot.scan().then((usbDevices) => {
      const typeUsbDevices = _.map(usbDevices, (usbDevice) => {
        const description = `Bus ${usbDevice.busNumber} / Address ${usbDevice.deviceAddress}`

        return _.assign({}, usbDevice, {
          type: 'USB_DEVICE',
          description: usbDevice.name,
          device: description,
          displayName: description,
          protected: false,
          size: null,
          system: false
        })
      })

      callback(null, _.concat(typeUsbDevices, typeDrives))
    }).catch((err) => {
      const LIBUSB_TRANSFER_STALL = 4
      if (err.errno === LIBUSB_TRANSFER_STALL) {
        return callback(null, typeDrives)
      }

      return callback(err)
    })
  })
}

const availableDrives = Rx.Observable.timer(
  DRIVE_SCANNER_FIRST_SCAN_DELAY_MS,
  DRIVE_SCANNER_INTERVAL_MS
)

/* eslint-enable lodash/prefer-lodash-method */

  .flatMap(() => {
    return Rx.Observable.fromNodeCallback(lister)()
  })

  .map((devices) => {
    if (settings.get('unsafeMode')) {
      return devices
    }

    return _.reject(devices, {
      system: true
    })
  })
  .pausable(new Rx.Subject())

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
availableDrives.subscribe((devices) => {
  emitter.emit('devices', devices)
}, (error) => {
  emitter.emit('error', error)
})

/**
 * @summary Start scanning drives
 * @function
 * @public
 *
 * @example
 * driveScanner.start();
 */
emitter.start = () => {
  availableDrives.resume()
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
  availableDrives.pause()
}

module.exports = emitter
