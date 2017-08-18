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
const usb = require('./usb')

// The equivalent of a NULL buffer, given that node-usb complains
// if the daata argument is not an instance of Buffer
const NULL_BUFFER_SIZE = 0
const NULL_BUFFER = Buffer.alloc(NULL_BUFFER_SIZE)

/**
 * @summary The size of the boot message bootcode length section
 * @type {Number}
 * @constant
 */
const BOOT_MESSAGE_BOOTCODE_LENGTH_SIZE = 4

/**
 * @summary The offset of the boot message bootcode length section
 * @type {Number}
 * @constant
 */
const BOOT_MESSAGE_BOOTCODE_LENGTH_OFFSET = 0

/**
 * @summary The size of the boot message signature section
 * @type {Number}
 * @constant
 */
const BOOT_MESSAGE_SIGNATURE_SIZE = 20

/**
 * @summary The offset of the file message command section
 * @type {Number}
 * @constant
 */
const FILE_MESSAGE_COMMAND_OFFSET = 0

/**
 * @summary The size of the file message command section
 * @type {Number}
 * @constant
 */
const FILE_MESSAGE_COMMAND_LENGTH = 4

/**
 * @summary The offset of the file message file name section
 * @type {Number}
 * @constant
 */
const FILE_MESSAGE_FILE_NAME_OFFSET = FILE_MESSAGE_COMMAND_LENGTH

/**
 * @summary The size of the file message file name section
 * @type {Number}
 * @constant
 */
const FILE_MESSAGE_FILE_NAME_LENGTH = 256

/**
 * @summary The GET_STATUS usb control transfer request code
 * @type {Number}
 * @constant
 * @description
 * See http://www.jungo.com/st/support/documentation/windriver/811/wdusb_man_mhtml/node55.html#usb_standard_dev_req_codes
 */
const USB_REQUEST_CODE_GET_STATUS = 0

/**
 * @summary The maximum buffer length of a usbboot message
 * @type {Number}
 * @constant
 */
const USBBOOT_MESSAGE_MAX_BUFFER_LENGTH = 0xffff

/**
 * @summary The delay to wait between each USB read/write operation
 * @type {Number}
 * @constant
 * @description
 * The USB bus seems to hang if we execute many operations at
 * the same time.
 */
const USB_REQUEST_DELAY_MS = 1000

/**
 * @summary The timeout for USB bulk transfers, in milliseconds
 * @type {Number}
 * @constant
 */
const USB_BULK_TRANSFER_TIMEOUT_MS = 1000

/**
 * @summary The size of the usbboot file message
 * @type {Number}
 * @constant
 */
exports.FILE_MESSAGE_LENGTH = FILE_MESSAGE_COMMAND_LENGTH + FILE_MESSAGE_FILE_NAME_LENGTH

/**
 * @summary The "get file size" file message command name
 * @type {String}
 * @constant
 */
exports.FILE_MESSAGE_COMMAND_GET_FILE_SIZE = 'GetFileSize'

/**
 * @summary The "read file" file message command name
 * @type {String}
 * @constant
 */
exports.FILE_MESSAGE_COMMAND_READ_FILE = 'ReadFile'

/**
 * @summary The "done" file message command name
 * @type {String}
 * @constant
 */
exports.FILE_MESSAGE_COMMAND_DONE = 'Done'

/**
 * @summary The usbboot return code that represents success
 * @type {Number}
 * @constant
 */
exports.RETURN_CODE_SUCCESS = 0

/**
 * @summary The buffer length of the return code message
 * @type {Number}
 * @constant
 */
exports.RETURN_CODE_LENGTH = 4

exports.sendBufferSize = (device, size) => {
  return usb.performControlTransfer(device.instance, {
    bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR,
    bRequest: USB_REQUEST_CODE_GET_STATUS,
    data: NULL_BUFFER,

    /* eslint-disable no-bitwise */
    wValue: size & USBBOOT_MESSAGE_MAX_BUFFER_LENGTH,
    wIndex: size >> 16
    /* eslint-enable no-bitwise */
  })
}

/**
 * @summary Write a buffer to an OUT endpoint
 * @function
 * @private
 *
 * @param {Object} device - device
 * @param {Object} endpoint - endpoint
 * @param {Buffer} buffer - buffer
 * @returns {Promise}
 *
 * @example
 * usbboot.scan().then((devices) => {
 *   return protocol.write(devices[0], devices[0].interface(0).endpoint(1), Buffer.alloc(1)).then(() => {
 *     console.log('Done!')
 *   })
 * })
 */
exports.write = (device, endpoint, buffer) => {
  return exports.sendBufferSize(device, buffer.length)
    // We get LIBUSB_TRANSFER_STALL sometimes
    // in future bulk transfers without this
    .delay(USB_REQUEST_DELAY_MS)
    .then(() => {
      return Bluebird.fromCallback((callback) => {
        endpoint.timeout = USB_BULK_TRANSFER_TIMEOUT_MS
        endpoint.transfer(buffer, callback)
      })
    })
}

exports.sendErrorSignal = (device) => {
  // The original implementation sends a control transfer
  // with the size of a null buffer, and then the null
  // buffer itself, however sending the actual null buffer
  // seems unnecessary, an in fact confuses `node-usb`,
  // since the connection to the device is suddenly lost,
  // but the module keeps waiting for it
  return exports.sendBufferSize(device, NULL_BUFFER_SIZE)
}

/**
 * @summary Read a buffer from a device
 * @function
 * @private
 *
 * @param {Object} device - device
 * @param {Number} bytesToRead - bytes to read
 * @fulfil {Buffer} - data
 * @returns {Promise}
 *
 * @example
 * usbboot.scan().then((devices) => {
 *   return protocol.read(devices[0], 4).then((data) => {
 *     console.log(data.readInt32BE())
 *   })
 * })
 */
exports.read = (device, bytesToRead) => {
  return usb.performControlTransfer(device.instance, {
    /* eslint-disable no-bitwise */
    bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR | usb.LIBUSB_ENDPOINT_IN,
    wValue: bytesToRead & USBBOOT_MESSAGE_MAX_BUFFER_LENGTH,
    wIndex: bytesToRead >> 16,
    /* eslint-enable no-bitwise */

    bRequest: USB_REQUEST_CODE_GET_STATUS,
    length: bytesToRead
  })
}

/**
 * @summary Create a boot message buffer
 * @function
 * @private
 *
 * @description
 * This is based on the following data structure:
 *
 * typedef struct MESSAGE_S {
 *   int length;
 *   unsigned char signature[20];
 * } boot_message_t;
 *
 * This needs to be sent to the out endpoint of the USB device
 * as a 24 bytes big-endian buffer where:
 *
 * - The first 4 bytes contain the size of the bootcode.bin buffer
 * - The remaining 20 bytes contain the boot signature, which
 *   we don't make use of in this implementation
 *
 * @param {Buffer} bootCodeBufferLength - bootcode.bin buffer length
 * @returns {Buffer} boot message buffer
 *
 * @example
 * const bootMessageBuffer = protocol.createBootMessageBuffer(50216)
 */
exports.createBootMessageBuffer = (bootCodeBufferLength) => {
  const bootMessageBufferSize = BOOT_MESSAGE_BOOTCODE_LENGTH_SIZE + BOOT_MESSAGE_SIGNATURE_SIZE

  // Buffers are automatically filled with zero bytes
  const bootMessageBuffer = Buffer.alloc(bootMessageBufferSize)

  // The bootcode length should be stored in 4 big-endian bytes
  bootMessageBuffer.writeInt32BE(bootCodeBufferLength, BOOT_MESSAGE_BOOTCODE_LENGTH_OFFSET)

  return bootMessageBuffer
}

exports.parseFileMessageBuffer = (fileMessageBuffer) => {
  const commandCode = fileMessageBuffer.readInt32LE(FILE_MESSAGE_COMMAND_OFFSET)
  const command = _.nth([
    exports.FILE_MESSAGE_COMMAND_GET_FILE_SIZE,
    exports.FILE_MESSAGE_COMMAND_READ_FILE,
    exports.FILE_MESSAGE_COMMAND_DONE
  ], commandCode)

  if (_.isNil(command)) {
    throw new Error(`Invalid file message command code: ${commandCode}`)
  }

  const fileName = _.chain(fileMessageBuffer.toString('ascii', FILE_MESSAGE_FILE_NAME_OFFSET))

    // The parsed string will likely contain tons of trailing
    // null bytes that we should get rid of for convenience
    // See https://github.com/nodejs/node/issues/4775
    .takeWhile((character) => {
      return character !== '\0'
    })
    .join('')
    .value()

  // A blank file name can also mean "done"
  if (_.isEmpty(fileName)) {
    return {
      command: exports.FILE_MESSAGE_COMMAND_DONE
    }
  }

  return {
    command,
    fileName
  }
}
