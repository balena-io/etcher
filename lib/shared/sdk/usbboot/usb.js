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

// The USB module calls `libusb_init`, which will fail
// if the device we're running in has no USB controller
// plugged in (e.g. in certain CI services).
// In order to workaround that, we need to return a
// stub if such error occurs.
const usb = (() => {
  try {
    return require('usb')
  } catch (error) {
    return {
      getDeviceList: _.constant([])
    }
  }
})()

// Re-expose some `usb` constants
_.each([
  'LIBUSB_REQUEST_TYPE_VENDOR',
  'LIBUSB_ENDPOINT_IN',
  'LIBUSB_TRANSFER_TYPE_BULK',
  'LIBUSB_ERROR_NO_DEVICE',
  'LIBUSB_ERROR_IO'
], (constant) => {
  exports[constant] = usb[constant]
})

/**
 * @summary The timeout for USB control transfers, in milliseconds
 * @type {Number}
 * @constant
 */
// In node-usb, 0 means "infinite" timeout
const USB_CONTROL_TRANSFER_TIMEOUT_MS = 0

/**
 * @summary List the available USB devices
 * @function
 * @public
 *
 * @fulfil {Object[]} - usb devices
 * @returns {Promise}
 *
 * @example
 * usb.listDevices().each((device) => {
 *   console.log(device)
 * })
 */
exports.listDevices = () => {
  const devices = _.map(usb.getDeviceList(), (device) => {
    device.accessible = true
    return device
  })

  // Include driverless devices into the list of USB devices.
  if (process.platform === 'win32') {
    // NOTE: Temporarily ignore errors when loading winusb-driver-generator,
    // due to C Runtime issues on Windows;
    // see https://github.com/resin-io/etcher/issues/1956
    try {
      const winusbDriverGenerator = require('winusb-driver-generator')
      for (const device of winusbDriverGenerator.listDriverlessDevices()) {
        devices.push({
          accessible: false,
          deviceDescriptor: {
            idVendor: device.vid,
            idProduct: device.pid
          }
        })
      }
    } catch (error) {
      // Ignore error
    }
  }

  return Bluebird.resolve(devices)
}

/**
 * @summary Get a USB device string from an index
 * @function
 * @public
 *
 * @param {Object} device - device
 * @param {Number} index - string index
 * @fulfil {String} - string
 * @returns {Promise}
 *
 * @example
 * usb.getDeviceStringFromIndex({ ... }, 5).then((string) => {
 *   console.log(string)
 * })
 */
exports.getDeviceStringFromIndex = (device, index) => {
  return Bluebird.fromCallback((callback) => {
    device.getStringDescriptor(index, callback)
  })
}

/**
 * @summary Perform a USB control transfer
 * @function
 * @public
 *
 * @description
 * See http://libusb.sourceforge.net/api-1.0/group__syncio.html
 *
 * @param {Object} device - usb device
 * @param {Object} options - options
 * @param {Number} options.bmRequestType - the request type field for the setup packet
 * @param {Number} options.bRequest - the request field for the setup packet
 * @param {Number} options.wValue - the value field for the setup packet
 * @param {Number} options.wIndex - the index field for the setup packet
 * @param {Buffer} [options.data] - output data buffer (for OUT transfers)
 * @param {Number} [options.length] - input data size (for IN transfers)
 * @fulfil {(Buffer|Undefined)} - result
 * @returns {Promise}
 *
 * @example
 * const buffer = Buffer.alloc(512)
 *
 * usb.performControlTransfer({ ... }, {
 *   bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR
 *   bRequest: 0,
 *   wValue: buffer.length & 0xffff,
 *   wIndex: buffer.length >> 16,
 *   data: Buffer.alloc(256)
 * })
 */
exports.performControlTransfer = (device, options) => {
  if (_.isNil(options.data) && _.isNil(options.length)) {
    return Bluebird.reject(new Error('You must define either data or length'))
  }

  if (!_.isNil(options.data) && !_.isNil(options.length)) {
    return Bluebird.reject(new Error('You can define either data or length, but not both'))
  }

  return Bluebird.fromCallback((callback) => {
    device.timeout = USB_CONTROL_TRANSFER_TIMEOUT_MS
    device.controlTransfer(
      options.bmRequestType,
      options.bRequest,
      options.wValue,
      options.wIndex,
      options.data || options.length,
      callback
    )
  })
}
