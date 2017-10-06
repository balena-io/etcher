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
 * @summary The name of this adaptor
 * @public
 * @type {String}
 * @constant
 */
exports.name = 'usbboot'

/**
 * @summary Vendor ID of "Broadcom Corporation"
 * @type {Number}
 * @constant
 */
const USB_VENDOR_ID_BROADCOM_CORPORATION = 0x0a5c

/**
 * @summary Product ID of BCM2708
 * @type {Number}
 * @constant
 */
const USB_PRODUCT_ID_BCM2708_BOOT = 0x2763

/**
 * @summary Product ID of BCM2710
 * @type {Number}
 * @constant
 */
const USB_PRODUCT_ID_BCM2710_BOOT = 0x2764

/**
 * @summary List of usbboot capable devices
 * @type {Object[]}
 * @constant
 */
const USBBOOT_CAPABLE_USB_DEVICES = [

  // BCM2835

  {
    vendorID: USB_VENDOR_ID_BROADCOM_CORPORATION,
    productID: USB_PRODUCT_ID_BCM2708_BOOT
  },

  // BCM2837

  {
    vendorID: USB_VENDOR_ID_BROADCOM_CORPORATION,
    productID: USB_PRODUCT_ID_BCM2710_BOOT
  }

]

/**
 * @summary The timeout for USB device operations
 * @type {Number}
 * @constant
 */
const USB_OPERATION_TIMEOUT_MS = 1000

/**
 * @summary The number of USB endpoint interfaces in devices with a BCM2835 SoC
 * @type {Number}
 * @constant
 */
const USB_ENDPOINT_INTERFACES_SOC_BCM2835 = 1

/**
 * @summary The USB device descriptor index of an empty property
 * @type {Number}
 * @constant
 */
const USB_DESCRIPTOR_NULL_INDEX = 0

/**
 * @summary usbboot bootcode file name
 * @type {String}
 * @constant
 */
const USBBOOT_BOOTCODE_FILE_NAME = 'bootcode.bin'

/**
 * @summary Check if a USB device object is usbboot-capable
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
 * @summary The radix used by USB ID numbers
 * @type {Number}
 * @constant
 */
const USB_ID_RADIX = 16

/**
 * @summary The expected length of a USB ID number
 * @type {Number}
 * @constant
 */
const USB_ID_LENGTH = 4

/**
 * @summary Convert a USB id (e.g. product/vendor) to a string
 * @function
 * @private
 *
 * @param {Number} id - USB id
 * @returns {String} string id
 *
 * @example
 * console.log(usbIdToString(2652))
 * > '0x0a5c'
 */
const usbIdToString = (id) => {
  return `0x${_.padStart(id.toString(USB_ID_RADIX), USB_ID_LENGTH, '0')}`
}

/**
 * @summary Write bootcode to USB device (usbboot first stage)
 * @function
 * @private
 *
 * @description
 * After this stage is run, the USB will be re-mounted as 0x0a5c:0x2764.
 *
 * @param {Object} device - node-usb device
 * @param {Object} endpoint - node-usb endpoint
 * @param {Buffer} bootCodeBuffer - bootcode buffer
 * @returns {Promise}
 *
 * @example
 * const usb = require('usb')
 * const device = usb.findByIds(0x0a5c, 0x2763)
 * const bootcode = fs.readFileSync('./bootcode.bin')
 *
 * writeBootCode(device, device.interfaces(0).endpoint(1), bootcode).then(() => {
 *   console.log('Done!')
 * })
 */
const writeBootCode = (device, endpoint, bootCodeBuffer) => {
  debug('Writing bootcode')
  debug(`Bootcode buffer length: ${bootCodeBuffer.length}`)
  const bootMessageBuffer = protocol.createBootMessageBuffer(bootCodeBuffer.length)

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

/**
 * @summary Mount a USB device as a block device (usbboot second stage)
 * @function
 * @private
 *
 * @description
 * The possible files you can pass here are:
 *
 * - autoboot.txt
 * - config.txt
 * - recovery.elf
 * - start.elf
 * - fixup.dat
 *
 * @param {Object} device - node-usb device
 * @param {Object} endpoint - node-usb endpoint
 * @param {Object} files - a set of file buffers
 * @returns {Promise}
 *
 * @example
 * const usb = require('usb')
 * const device = usb.findByIds(0x0a5c, 0x2763)
 *
 * startFileServer(device, device.interfaces(0).endpoint(1), {
 *   'start.elf': fs.readFileSync('./start.elf')
 * }).then(() => {
 *   console.log('Done!')
 * })
 */
const startFileServer = (device, endpoint, files) => {
  debug('Listening for file messages')
  return protocol
    .read(device, protocol.FILE_MESSAGE_SIZE)
    .then(protocol.parseFileMessageBuffer)

    // We get these error messages when reading a command
    // from the device when the communication has ended
    .catch({
      message: 'LIBUSB_TRANSFER_STALL'
    }, {
      message: 'LIBUSB_TRANSFER_ERROR'
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
        return startFileServer(device, endpoint, files)
      })
    })
}

/**
 * @summary Scan for usbboot capable USB devices
 * @function
 * @public
 *
 * @description
 * You should at the very least pass a file named `bootcode.bin`.
 *
 * @param {Object} options - options
 * @param {Object} options.files - files buffers
 * @fulfil {Object[]} - USB devices
 * @returns {Promise}
 *
 * @example
 * usbboot.scan({
 *   files: {
 *     'bootcode.bin': fs.readFileSync('./msd/bootcode.bin'),
 *     'start.elf': fs.readFileSync('./msd/start.elf')
 *   }
 * }).each((device) => {
 *   console.log(device)
 * })
 */
exports.scan = (options) => {
  /* eslint-disable lodash/prefer-lodash-method */
  return usb.listDevices().filter(isUsbBootCapableUSBDevice).map((device) => {
  /* eslint-enable lodash/prefer-lodash-method */

    const idPair = _.join([
      usbIdToString(device.deviceDescriptor.idVendor),
      usbIdToString(device.deviceDescriptor.idProduct)
    ], ':')

    device.device = idPair
    device.displayName = idPair
    device.raw = idPair
    device.size = null
    device.mountpoints = []
    device.protected = false
    device.system = false
    device.pending = true
    device.adaptor = exports.name

    // We need to open the device in order to access _configDescriptor
    debug(`Opening device: ${device.name}`)
    device.open()

    // Ensures we don't wait forever if an issue occurs
    device.timeout = USB_OPERATION_TIMEOUT_MS

    // Handle 2837 where it can start with two interfaces, the first
    // is mass storage the second is the vendor interface for programming
    const addresses = {}
    /* eslint-disable no-underscore-dangle */
    if (device._configDescriptor.bNumInterfaces === USB_ENDPOINT_INTERFACES_SOC_BCM2835) {
    /* eslint-enable no-underscore-dangle */
      addresses.interface = 0
      addresses.endpoint = 1
    } else {
      addresses.interface = 1
      addresses.endpoint = 3
    }

    const deviceInterface = device.interface(addresses.interface)
    debug(`Claiming interface: ${addresses.interface}`)
    deviceInterface.claim()

    const endpoint = deviceInterface.endpoint(addresses.endpoint)

    return usb.getDeviceName(device).then((deviceName) => {
      device.description = `${deviceName.manufacturer} ${deviceName.product}`
    }).then(() => {
      const serialNumberIndex = device.deviceDescriptor.iSerialNumber
      debug(`Serial number index: ${serialNumberIndex}`)

      if (serialNumberIndex === USB_DESCRIPTOR_NULL_INDEX) {
        return writeBootCode(device, endpoint, _.get(options.files, [
          USBBOOT_BOOTCODE_FILE_NAME
        ]))
      }

      debug('Starting file server')
      return startFileServer(device, endpoint, options.files)
    }).return(device).finally(() => {
      device.close()
    })

  // See http://bluebirdjs.com/docs/api/promise.map.html
  }, {
    concurrency: 5
  })
}
