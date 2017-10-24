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
 * @summary The cache of blobs
 * @type {Object}
 * @constant
 */
const BLOBS_CACHE = {}

/**
 * @summary Query a blob from the internal cache
 * @function
 * @private
 *
 * @param {String} name - blob name
 * @param {Function} fallback - fallback function
 * @fulfil {Buffer} - blob
 * @returns {Promise}
 *
 * @example
 * const Bluebird = require('bluebird')
 * const fs = Bluebird.promisifyAll(require('fs'))
 *
 * const blob = queryBlobFromCache('start.elf', (name) => {
 *   return fs.readFileAsync(path.join('./blobs', name))
 * })
 */
const queryBlobFromCache = (name, fallback) => {
  if (BLOBS_CACHE[name]) {
    return Bluebird.resolve(BLOBS_CACHE[name])
  }

  return fallback(name).tap((buffer) => {
    BLOBS_CACHE[name] = buffer
  })
}

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
 * @param {Function} readFile - read file function
 * @returns {Promise}
 *
 * @example
 * const fs = Bluebird.promisifyAll(require('fs'))
 * const usb = require('usb')
 * const device = usb.findByIds(0x0a5c, 0x2763)
 *
 * startFileServer(device, device.interfaces(0).endpoint(1), (name) => {
 *   return fs.readFileAsync(name)
 * }).then(() => {
 *   console.log('Done!')
 * })
 */
const startFileServer = (device, endpoint, readFile) => {
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
        command: protocol.FILE_MESSAGE_COMMANDS.DONE
      }
    })

    .then((fileMessage) => {
      debug(`Received message: ${fileMessage.command} -> ${fileMessage.fileName}`)

      if (fileMessage.command === protocol.FILE_MESSAGE_COMMANDS.DONE) {
        debug('Done')
        return Bluebird.resolve()
      }

      return Bluebird.try(() => {
        if (fileMessage.command === protocol.FILE_MESSAGE_COMMANDS.GET_FILE_SIZE) {
          debug(`Getting the size of ${fileMessage.fileName}`)

          return queryBlobFromCache(fileMessage.fileName, readFile).then((fileBuffer) => {
            const fileSize = fileBuffer.length
            debug(`Sending size: ${fileSize}`)
            return protocol.sendBufferSize(device, fileSize)
          }).catch({
            code: 'ENOENT'
          }, () => {
            debug(`Couldn't find ${fileMessage.fileName}`)
            debug('Sending error signal')
            return protocol.sendErrorSignal(device)
          })
        }

        if (fileMessage.command === protocol.FILE_MESSAGE_COMMANDS.READ_FILE) {
          debug(`Reading ${fileMessage.fileName}`)

          return queryBlobFromCache(fileMessage.fileName, readFile).then((fileBuffer) => {
            return protocol.write(device, endpoint, fileBuffer)
          }).catch({
            code: 'ENOENT'
          }, () => {
            debug(`Couldn't find ${fileMessage.fileName}`)
            debug('Sending error signal')
            return protocol.sendErrorSignal(device)
          })
        }

        return Bluebird.reject(new Error(`Unrecognized command: ${fileMessage.command}`))
      }).then(() => {
        debug('Starting again')
        return startFileServer(device, endpoint, readFile)
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
 * @param {Function} options.readFile - file reading function
 * @fulfil {Object[]} - USB devices
 * @returns {Promise}
 *
 * @example
 * const fs = Bluebird.promisifyAll(require('fs'))
 *
 * usbboot.scan({
 *   readFile: (name) => {
 *     return fs.readFileAsync(name)
 *   }
 * }).each((device) => {
 *   console.log(device)
 * })
 */
exports.scan = (options) => {
  /* eslint-disable lodash/prefer-lodash-method */
  return usb.listDevices().filter(isUsbBootCapableUSBDevice).map((device) => {
  /* eslint-enable lodash/prefer-lodash-method */

    // This is the only way we can unique identify devices
    device.device = `${device.busNumber}:${device.deviceAddress}`

    device.displayName = 'Initializing device'
    device.description = 'Compute Module'
    device.raw = device.device
    device.size = null
    device.mountpoints = []
    device.protected = false
    device.system = false
    device.disabled = true
    device.icon = 'loading'
    device.vendor = usbIdToString(device.deviceDescriptor.idVendor)
    device.product = usbIdToString(device.deviceDescriptor.idProduct)
    device.adaptor = exports.name

    // We need to open the device in order to access _configDescriptor
    debug(`Opening device: ${device.device} (${device.vendor}:${device.product})`)
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

    try {
      deviceInterface.claim()
    } catch (error) {
      if (error.message === 'LIBUSB_ERROR_NO_DEVICE') {
        debug('Couldn\'t claim the interface. Assuming the device is gone')
        return null
      }

      throw error
    }

    const endpoint = deviceInterface.endpoint(addresses.endpoint)

    return Bluebird.try(() => {
      const serialNumberIndex = device.deviceDescriptor.iSerialNumber
      debug(`Serial number index: ${serialNumberIndex}`)

      if (serialNumberIndex === USB_DESCRIPTOR_NULL_INDEX) {
        return queryBlobFromCache(USBBOOT_BOOTCODE_FILE_NAME, options.readFile).then((bootcode) => {
          return writeBootCode(device, endpoint, bootcode)
        })
      }

      debug('Starting file server')
      return startFileServer(device, endpoint, options.readFile)
    }).return(device).catch({
      message: 'LIBUSB_TRANSFER_CANCELLED'
    }, {
      message: 'LIBUSB_ERROR_NO_DEVICE'
    }, _.constant(null)).tap((result) => {
      if (result) {
        result.close()
      }
    })

  // See http://bluebirdjs.com/docs/api/promise.map.html
  }, {
    concurrency: 5
  }).then(_.compact)
}
