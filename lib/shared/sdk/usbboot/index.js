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
const EventEmitter = require('events')
const Bluebird = require('bluebird')
const debug = require('debug')('sdk:usbboot')
const usb = require('./usb')
const protocol = require('./protocol')
const utils = require('../../utils')

debug.enabled = true

debug.enabled = true

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
 * @summary Estimated device reboot delay
 * @type {Number}
 * @constant
 */
const DEVICE_REBOOT_DELAY = 6000

/**
 * @summary The initial step of the file server usbboot phase
 * @constant
 * @type {Number}
 * @private
 */
const DEFAULT_FILE_SERVER_STEP = 1

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
 * @summary USBBootAdapter
 * @class
 */
class USBBootAdapter extends EventEmitter {
  /**
   * @summary USBBootAdapter constructor
   * @class
   * @example
   * const adapter = new USBBootAdapter()
   */
  constructor () {
    super()

    /** @type {String} Adapter name */
    this.id = this.constructor.id

    /** @type {Object} Blob cache */
    this.blobCache = {}

    /** @type {Object} Progress hash */
    this.progress = {}

    this.devices = []
    this.on('devices', (devices) => {
      this.devices = devices
    })
  }

  /**
   * @summary Query a blob from the internal cache
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
   * const blob = adapter.queryBlobFromCache('start.elf', (name) => {
   *   return fs.readFileAsync(path.join('./blobs', name))
   * })
   */
  queryBlobFromCache (name, fallback) {
    if (this.blobCache[name]) {
      return Bluebird.resolve(this.blobCache[name])
    }

    return fallback(name).tap((buffer) => {
      this.blobCache[name] = buffer
    })
  }

  /**
   * @summary Scan for usbboot capable USB devices
   * @public
   *
   * @description
   * You should at the very least pass a file named `bootcode.bin`.
   *
   * @param {Object} options - options
   * @param {Object} options.files - files buffers
   * @param {Function} [callback] - optional callback
   * @returns {USBBootAdapter}
   *
   * @example
   * adapter.scan({
   *   files: {
   *     'bootcode.bin': fs.readFileSync('./msd/bootcode.bin'),
   *     'start.elf': fs.readFileSync('./msd/start.elf')
   *   }
   * }, (error, devices) => {
   *   // ...
   * })
   */
  scan (options = {}, callback) {
    /* eslint-disable lodash/prefer-lodash-method */
    usb.listDevices().filter(isUsbBootCapableUSBDevice).map((device) => {
    /* eslint-enable lodash/prefer-lodash-method */

      // This is the only way we can unique identify devices
      device.raw = `${device.busNumber}:${device.deviceAddress}`

      const result = {
        device: device.raw,
        raw: device.raw,
        displayName: 'Initializing device',
        description: 'Compute Module',
        size: null,
        mountpoints: [],
        protected: false,
        system: false,
        disabled: true,
        icon: 'loading',
        vendor: usbIdToString(device.deviceDescriptor.idVendor),
        product: usbIdToString(device.deviceDescriptor.idProduct),
        adaptor: exports.name
      }

      if (_.isNil(this.progress[result.raw])) {
        this.prepare(device, {
          readFile: options.readFile
        }).catch((error) => {
          this.emit('error', error)
        })
      }

      result.progress = this.progress[result.raw]

      if (result.progress === utils.PERCENTAGE_MAXIMUM) {
        return Bluebird.delay(DEVICE_REBOOT_DELAY).return(result)
      }

      return result

    // See http://bluebirdjs.com/docs/api/promise.map.html
    }, {
      concurrency: 5
    }).catch((error) => {
      this.emit('error', error)
      callback && callback(error)
    }).then((devices) => {
      this.emit('devices', devices)
      callback && callback(null, devices)
    })

    return this
  }

  /**
   * @summary Prepare a usbboot device
   * @function
   * @private
   *
   * @param {Object} device - node-usb device
   * @param {Object} options - options
   * @param {Function} options.readFile - read file function
   * @returns {Promise}
   *
   * @example
   * const fs = Bluebird.promisifyAll(require('fs'))
   * const usb = require('usb')
   * const device = usb.findByIds(0x0a5c, 0x2763)
   *
   * adapter.prepare(device, (name) => {
   *   return fs.readFileAsync(name)
   * }).then(() => {
   *   console.log('Done!')
   * })
   */
  prepare (device, options) {
    /**
     * @summary Set device progress
     * @function
     * @private
     *
     * @param {Number} percentage - percentage
     *
     * @example
     * setProgress(90)
     */
    const setProgress = (percentage) => {
      debug(`%c[${device.raw}] -> ${Math.floor(percentage)}%%`, 'color:red;')
      this.progress[device.raw] = percentage
    }

    const serialNumberIndex = device.deviceDescriptor.iSerialNumber
    debug(`Serial number index: ${serialNumberIndex}`)
    if (serialNumberIndex === USB_DESCRIPTOR_NULL_INDEX) {
      // eslint-disable-next-line no-magic-numbers
      setProgress(10)
    } else {
      // eslint-disable-next-line no-magic-numbers
      setProgress(15)
    }

    return Bluebird.try(() => {
      // We need to open the device in order to access _configDescriptor
      debug(`Opening device: ${device.raw}`)
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

      if (serialNumberIndex === USB_DESCRIPTOR_NULL_INDEX) {
        return this.queryBlobFromCache(USBBOOT_BOOTCODE_FILE_NAME, options.readFile).then((bootcode) => {
          return USBBootAdapter.writeBootCode(device, endpoint, bootcode)
        })
      }

      debug('Starting file server')

      const PERCENTAGE_START = 20
      const PERCENTAGE_TOTAL = 95

      // TODO: Find a way to not hardcode these values, and instead
      // figure out the correct number for each board on the fly.
      // This might be possible once we implement proper device
      // auto-discovery. For now, we assume the worst case scenario.
      // eslint-disable-next-line no-magic-numbers
      const STEPS_TOTAL = 38

      return this.startFileServer(device, endpoint, {
        readFile: options.readFile,
        progress: (step) => {
          setProgress((step * (PERCENTAGE_TOTAL - PERCENTAGE_START) / STEPS_TOTAL) + PERCENTAGE_START)
        }
      }).tap(() => {
        setProgress(utils.PERCENTAGE_MAXIMUM)
      })
    }).return(device).catch({
      message: 'LIBUSB_TRANSFER_CANCELLED'
    }, {
      message: 'LIBUSB_ERROR_NO_DEVICE'
    }, _.constant(null)).tap((result) => {
      if (result) {
        result.close()
      }
    }).finally(() => {
      return Bluebird.delay(DEVICE_REBOOT_DELAY).then(() => {
        Reflect.deleteProperty(this.progress, device.raw)
      })
    })
  }

  /**
   * @summary Write bootcode to USB device (usbboot first stage)
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
   * adapter.writeBootCode(device, device.interfaces(0).endpoint(1), bootcode).then(() => {
   *   console.log('Done!')
   * })
   */
  static writeBootCode (device, endpoint, bootCodeBuffer) {
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
   * @param {Object} options - options
   * @param {Function} options.readFile - read file function
   * @param {Function} options.progress - progress function (step)
   * @param {Number} [step] - current step (used internally)
   * @returns {Promise}
   *
   * @example
   * const fs = Bluebird.promisifyAll(require('fs'))
   * const usb = require('usb')
   * const device = usb.findByIds(0x0a5c, 0x2763)
   *
   * adapter.startFileServer(device, device.interfaces(0).endpoint(1), {
   *   readFile: (name) => {
   *     return fs.readFileAsync(name)
   *   },
   *   progress: (step) => {
   *     console.log(`Currently on step ${step}`)
   *   }
   * }).then(() => {
   *   console.log('Done!')
   * })
   */
  startFileServer (device, endpoint, options, step = DEFAULT_FILE_SERVER_STEP) {
    debug(`Listening for file messages (step ${step})`)
    options.progress(step)
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

            return this.queryBlobFromCache(fileMessage.fileName, options.readFile).then((fileBuffer) => {
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

            return this.queryBlobFromCache(fileMessage.fileName, options.readFile).then((fileBuffer) => {
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
          const STEP_INCREMENT = 1
          return this.startFileServer(device, endpoint, options, step + STEP_INCREMENT)
        })
      })
  }
}

/**
 * @summary The name of this adapter
 * @public
 * @type {String}
 * @constant
 */
USBBootAdapter.id = 'usbboot'

// Exports
module.exports = USBBootAdapter
