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
// if the data argument is not an instance of Buffer
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
const FILE_MESSAGE_COMMAND_SIZE = 4

/**
 * @summary The offset of the file message file name section
 * @type {Number}
 * @constant
 */
const FILE_MESSAGE_FILE_NAME_OFFSET = FILE_MESSAGE_COMMAND_SIZE

/**
 * @summary The size of the file message file name section
 * @type {Number}
 * @constant
 */
const FILE_MESSAGE_FILE_NAME_SIZE = 256

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
// In node-usb, 0 means "infinite" timeout
const USB_BULK_TRANSFER_TIMEOUT_MS = 0

/**
 * @summary The amount of bits to shift to the right on a control transfer index
 * @type {Number}
 * @constant
 */
const CONTROL_TRANSFER_INDEX_RIGHT_BIT_SHIFT = 16

/**
 * @summary The size of the usbboot file message
 * @type {Number}
 * @constant
 */
exports.FILE_MESSAGE_SIZE = FILE_MESSAGE_COMMAND_SIZE + FILE_MESSAGE_FILE_NAME_SIZE

/**
 * @summary File message command display names
 * @namespace FILE_MESSAGE_COMMANDS
 * @public
 */
exports.FILE_MESSAGE_COMMANDS = {

  /**
   * @property {String}
   * @memberof FILE_MESSAGE_COMMANDS
   *
   * @description
   * The "get file size" file message command name.
   */
  GET_FILE_SIZE: 'GetFileSize',

  /**
   * @property {String}
   * @memberof FILE_MESSAGE_COMMANDS
   *
   * @description
   * The "read file" file message command name.
   */
  READ_FILE: 'ReadFile',

  /**
   * @property {String}
   * @memberof FILE_MESSAGE_COMMANDS
   *
   * @description
   * The "done" file message command name.
   */
  DONE: 'Done'
}

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

/**
 * @summary Send a buffer size to a device as a control transfer
 * @function
 * @public
 *
 * @param {Object} device - node-usb device
 * @param {Number} size - buffer size
 * @returns {Promise}
 *
 * @example
 * const usb = require('usb')
 * const device = usb.findByIds(0x0a5c, 0x2763)
 *
 * protocol.sendBufferSize(device, 512).then(() => {
 *   console.log('Done!')
 * })
 */
exports.sendBufferSize = (device, size) => {
  return usb.performControlTransfer(device, {
    bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR,
    bRequest: USB_REQUEST_CODE_GET_STATUS,
    data: NULL_BUFFER,

    /* eslint-disable no-bitwise */
    wValue: size & USBBOOT_MESSAGE_MAX_BUFFER_LENGTH,
    wIndex: size >> CONTROL_TRANSFER_INDEX_RIGHT_BIT_SHIFT
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
 * const usb = require('usb')
 * const device = usb.findByIds(0x0a5c, 0x2763)
 * return protocol.write(device, device.interface(0).endpoint(1), Buffer.alloc(1)).then(() => {
 *   console.log('Done!')
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

/**
 * @summary Send an error signal to a device
 * @function
 * @public
 *
 * @param {Object} device - node-usb device
 * @returns {Promise}
 *
 * @example
 * const usb = require('usb')
 * const device = usb.findByIds(0x0a5c, 0x2763)
 *
 * protocol.sendErrorSignal(device).then(() => {
 *   console.log('Done!')
 * })
 */
exports.sendErrorSignal = (device) => {
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
 * const usb = require('usb')
 * const device = usb.findByIds(0x0a5c, 0x2763)
 * protocol.read(device, 4).then((data) => {
 *   console.log(data.readInt32BE())
 * })
 */
exports.read = (device, bytesToRead) => {
  return usb.performControlTransfer(device, {
    /* eslint-disable no-bitwise */
    bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR | usb.LIBUSB_ENDPOINT_IN,
    wValue: bytesToRead & USBBOOT_MESSAGE_MAX_BUFFER_LENGTH,
    wIndex: bytesToRead >> CONTROL_TRANSFER_INDEX_RIGHT_BIT_SHIFT,
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
 * @param {Number} bootCodeBufferLength - bootcode.bin buffer length
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

/**
 * @summary Parse a file message buffer from a device
 * @function
 * @public
 *
 * @param {Buffer} fileMessageBuffer - file message buffer
 * @returns {Object} parsed file message
 *
 * @example
 * const usb = require('usb')
 * const device = usb.findByIds(0x0a5c, 0x2763)
 *
 * return protocol.read(device, protocol.FILE_MESSAGE_SIZE).then((fileMessageBuffer) => {
 *   return protocol.parseFileMessageBuffer(fileMessageBuffer)
 * }).then((fileMessage) => {
 *   console.log(fileMessage.command)
 *   console.log(fileMessage.fileName)
 * })
 */
exports.parseFileMessageBuffer = (fileMessageBuffer) => {
  const commandCode = fileMessageBuffer.readInt32LE(FILE_MESSAGE_COMMAND_OFFSET)
  const command = _.nth([
    exports.FILE_MESSAGE_COMMANDS.GET_FILE_SIZE,
    exports.FILE_MESSAGE_COMMANDS.READ_FILE,
    exports.FILE_MESSAGE_COMMANDS.DONE
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
      command: exports.FILE_MESSAGE_COMMANDS.DONE
    }
  }

  return {
    command,
    fileName
  }
}
