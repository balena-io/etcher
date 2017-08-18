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

/*
 * This work is heavily based on https://github.com/raspberrypi/usbboot
 * Copyright 2016 Raspberry Pi Foundation
 */

'use strict'

const _ = require('lodash')
const Bluebird = require('bluebird')
const debug = require('debug')('sdk:usbboot')
const usb = require('./usb')
const protocol = require('./protocol')

/**
 * @summary Vendor ID of "Broadcom Corporation"
 * @type {Number}
 * @constant
 */
const USB_VENDOR_ID_BROADCOM_CORPORATION = 0x0a5c

/**
 * @summary List of usbboot capable devices
 * @type {Object[]}
 * @constant
 */
const USBBOOT_CAPABLE_USB_DEVICES = [

  // BCM2835

  {
    vendorID: USB_VENDOR_ID_BROADCOM_CORPORATION,
    productID: 0x2763
  },

  // BCM2837

  {
    vendorID: USB_VENDOR_ID_BROADCOM_CORPORATION,
    productID: 0x2764
  }

]

/**
 * @summary The number of USB endpoint interfaces in devices with a BCM2835 SoC
 * @type {Number}
 * @constant
 */
const USB_ENDPOINT_INTERFACES_SOC_BCM2835 = 1

/**
 * @summary The delay to wait between each USB read/write operation
 * @type {Number}
 * @constant
 * @description
 * The USB bus seems to hang if we execute many operations at
 * the same time.
 */
const USB_OPERATION_DELAY_MS = 1000

/**
 * @summary The USB device descriptor index of an empty property
 * @type {Number}
 * @constant
 */
const USB_DESCRIPTOR_NULL_INDEX = 0

/**
 * @summary Check if a node-usb device object is usbboot-capable
 * @function
 * @private
 *
 * @param {Object} device - device
 * @returns {Boolean} whether the device is usbboot-capable
 *
 * @example
 * if (isUsbBootCapableUSBDevice({ ... })) {
 *   console.log('We can use usbboot on this device')
 * }
 */
const isUsbBootCapableUSBDevice = (device) => {
  return _.some(USBBOOT_CAPABLE_USB_DEVICES, {
    vendorID: device.deviceDescriptor.idVendor,
    productID: device.deviceDescriptor.idProduct
  })
}

/**
 * @summary Scan for usbboot USB capable devices
 * @function
 * @public
 *
 * @fulfil {Object[]} - USB devices
 * @returns {Promise}
 *
 * @example
 * usbboot.scan().each((device) => {
 *   console.log(device)
 * })
 */
exports.scan = () => {
  /* eslint-disable lodash/prefer-lodash-method */
  return usb.listDevices().filter(isUsbBootCapableUSBDevice).map((device) => {
  /* eslint-enable lodash/prefer-lodash-method */

    // We must keep the original device object from `node-usb`,
    // since it has functions in its prototype we must use later on
    const deviceWrapper = {
      instance: device
    }

    // We need to open the device in order to access _configDescriptor
    device.open()

    // Handle 2837 where it can start with two interfaces, the first
    // is mass storage the second is the vendor interface for programming

    /* eslint-disable no-underscore-dangle */
    if (device._configDescriptor.bNumInterfaces === USB_ENDPOINT_INTERFACES_SOC_BCM2835) {
    /* eslint-enable no-underscore-dangle */
      deviceWrapper.interface = 0
      deviceWrapper.outEndpoint = 1
    } else {
      deviceWrapper.interface = 1
      deviceWrapper.outEndpoint = 3
    }

    return usb.getDeviceName(device).then((name) => {
      deviceWrapper.name = name
      return deviceWrapper
    }).finally(_.bind(device.close, device))
  })
}

/**
 * @summary Wait for a USB device
 * @function
 * @private
 *
 * @description
 * This function returns the *first* device that matches
 * the specified criteria.
 *
 * @param {Object} properties - properties of the expected device
 * @param {Object} options - options
 * @param {Number} options.retries - number of retries before giving up
 * @param {Number} options.delay - milliseconds before each retry
 * @fulfil {(Object|Undefined)} - device
 * @returns {Promise}
 *
 * @example
 * return waitForDevice({
 *   deviceDescriptor: {
 *     idVendor: 0x0a5c
 *   }
 * }, {
 *   retries: 10,
 *   delay: 500
 * }).then((device) => {
 *   if (device) {
 *     console.log('Found!')
 *   }
 * })
 */
const waitForDevice = (properties, options) => {
  return exports.scan().then((devices) => {
    return _.find(devices, (device) => {
      return _.matches(properties, device.instance)
    })
  }).then((device) => {
    if (_.isNil(device) && options.retries) {
      return Bluebird.delay(options.delay).then(() => {
        const INTERVAL_DECREASE_FACTOR = 1
        return waitForDevice(properties, {
          retries: options.retries - INTERVAL_DECREASE_FACTOR,
          delay: options.delay
        })
      })
    }

    return device
  })
}

const writeBootCode = (device, bootCodeBuffer) => {
  debug('Writing bootcode')
  debug(`Bootcode buffer length: ${bootCodeBuffer.length}`)
  const bootMessageBuffer = protocol.createBootMessageBuffer(bootCodeBuffer.length)

  const endpoint = device.instance.interface(device.interface).endpoint(device.outEndpoint)

  debug('Writing boot message buffer to out endpoint')
  return protocol.write(device, endpoint, bootMessageBuffer).then(() => {
    debug('Writing boot code buffer to out endpoint')
    return protocol.write(device, endpoint, bootCodeBuffer)
  }).then(() => {
    debug('Reading return code from device')
    return protocol.read(device, protocol.RETURN_CODE_LENGTH)
  }).then((data) => {
    const returnCode = data.readInt32LE()
    debug(`Received return code: ${returnCode}`)

    if (returnCode !== protocol.RETURN_CODE_SUCCESS) {
      throw new Error(`Couldn't write the bootcode, got return code ${returnCode} from device`)
    }
  })
}

const startFileServer = (device, files) => {
  debug('Listening for file messages')
  return protocol
    .read(device, protocol.FILE_MESSAGE_LENGTH)
    .then(protocol.parseFileMessageBuffer)

    // We get this error message when reading a command
    // from the device when the communication has ended
    .catch({
      message: 'LIBUSB_TRANSFER_STALL'
    }, (error) => {
      debug(`Got ${error.message} when reading a command, assuming everything is done`)
      return {
        command: protocol.FILE_MESSAGE_COMMAND_DONE
      }
    })

    .then((fileMessage) => {
      debug(`Received message: ${fileMessage.command} -> ${fileMessage.fileName}`)

      if (fileMessage.command === protocol.FILE_MESSAGE_COMMAND_DONE) {
        debug('Done')
        return Bluebird.resolve()
      }

      const endpoint = device.instance.interface(device.interface).endpoint(device.outEndpoint)

      return Bluebird.try(() => {
        if (fileMessage.command === protocol.FILE_MESSAGE_COMMAND_GET_FILE_SIZE) {
          debug(`Getting the size of ${fileMessage.fileName}`)
          const fileSize = _.get(files, [ fileMessage.fileName, 'length' ])

          if (_.isNil(fileSize)) {
            debug(`Couldn't find ${fileMessage.fileName}`)
            debug('Sending error signal')
            return protocol.sendErrorSignal(device)
          }

          debug(`Sending size: ${fileSize}`)
          return protocol.sendBufferSize(device, fileSize)
        }

        if (fileMessage.command === protocol.FILE_MESSAGE_COMMAND_READ_FILE) {
          debug(`Reading ${fileMessage.fileName}`)
          const fileBuffer = _.get(files, [ fileMessage.fileName ])

          if (_.isNil(fileBuffer)) {
            debug(`Couldn't find ${fileMessage.fileName}`)
            debug('Sending error signal')
            return protocol.sendErrorSignal(device)
          }

          return protocol.write(device, endpoint, fileBuffer)
        }

        return Bluebird.reject(new Error(`Unrecognized command: ${fileMessage.command}`))
      }).then(() => {
        debug('Starting again')
        return startFileServer(device, files)
      })
    })
}

exports.flash = (device, options = {}) => {
  debug('Opening device')
  device.instance.open()

  const deviceInterface = device.instance.interface(device.interface)
  debug(`Claiming interface: ${device.interface}`)
  deviceInterface.claim()

  const serialNumberIndex = device.instance.deviceDescriptor.iSerialNumber
  debug(`Serial number index: ${serialNumberIndex}`)

  if (serialNumberIndex === USB_DESCRIPTOR_NULL_INDEX) {
    return writeBootCode(device, _.get(options.files, [ 'bootcode.bin' ])).finally(() => {
      debug('Closing device instance')
      return device.instance.close()
    }).delay(USB_OPERATION_DELAY_MS).then(() => {
      debug('Waiting for device to come back')
      return waitForDevice({
        deviceDescriptor: {
          idVendor: USB_VENDOR_ID_BROADCOM_CORPORATION,
          idProduct: 0x2764,
          iSerialNumber: 1
        }
      }, {
        retries: 5,
        delay: 1000
      })
    }).then((newDevice) => {
      if (_.isNil(newDevice)) {
        const deviceName = `${device.instance.deviceDescriptor.idVendor}:${device.instance.deviceDescriptor.idProduct}`
        throw new Error(`Device ${deviceName} never came back`)
      }

      return exports.flash(newDevice, options)
    })
  }

  debug('Starting file server')
  return startFileServer(device, options.files).finally(() => {
    debug('Closing new device instance')
    device.instance.close()
  })
}
