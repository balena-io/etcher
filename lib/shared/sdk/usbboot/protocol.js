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

const Bluebird = require('bluebird')
const usb = require('./usb')

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
 *   return protocol.write(devices[0], devices[0].interfaces[0].endpoints[1], Buffer.alloc(1)).then(() => {
 *     console.log('Done!')
 *   })
 * })
 */
exports.write = (device, endpoint, buffer) => {
  if (buffer.length > USBBOOT_MESSAGE_MAX_BUFFER_LENGTH) {
    return Bluebird.reject(`Can't transfer buffers larger than ${USBBOOT_MESSAGE_MAX_BUFFER_LENGTH} bytes`)
  }

  // The equivalent of a NULL buffer, given that node-usb complains
  // if the daata argument is not an instance of Buffer
  const NULL_BUFFER_SIZE = 0
  const NULL_BUFFER = Buffer.alloc(NULL_BUFFER_SIZE)

  return usb.performControlTransfer(device.instance, {
    bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR,
    bRequest: USB_REQUEST_CODE_GET_STATUS,
    wValue: buffer.length,
    data: NULL_BUFFER,

    /* eslint-disable no-bitwise */
    wIndex: buffer.length >> 16
    /* eslint-enable no-bitwise */
  }).then(() => {
    return endpoint.transfer(buffer)

  // The USB bus seems to hang if we don't wait
  // a bit after each write operation
  }).delay(USB_REQUEST_DELAY_MS)
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
  if (bytesToRead > USBBOOT_MESSAGE_MAX_BUFFER_LENGTH) {
    return Bluebird.reject(`Can't request buffers larger than ${USBBOOT_MESSAGE_MAX_BUFFER_LENGTH} bytes`)
  }

  return usb.performControlTransfer(device.instance, {
    /* eslint-disable no-bitwise */
    bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR | usb.LIBUSB_ENDPOINT_IN,
    wIndex: bytesToRead >> 16,
    /* eslint-enable no-bitwise */

    wValue: bytesToRead,
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
