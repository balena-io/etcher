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

const _ = require('lodash')

const prettyBytes = require('pretty-bytes')

/**
 * @summary Megabyte to byte ratio
 * @constant
 * @private
 * @type {Number}
 *
 * @description
 * 1 MB = 1e+6 B
 */
const MEGABYTE_TO_BYTE_RATIO = 1000000

/**
 * @summary Milliseconds in a day
 * @constant
 * @private
 * @type {Number}
 *
 * @description
 * From 24 * 60 * 60 * 1000
 */
const MILLISECONDS_IN_A_DAY = 86400000

/**
 * @summary Convert bytes to megabytes
 * @function
 * @public
 *
 * @param {Number} bytes - bytes
 * @returns {Number} megabytes
 *
 * @example
 * const result = units.bytesToMegabytes(7801405440);
 */
exports.bytesToMegabytes = (bytes) => {
  return bytes / MEGABYTE_TO_BYTE_RATIO
}

/**
 * @summary Convert bytes to most appropriate unit string
 * @function
 * @public
 *
 * @param {Number} bytes - bytes
 * @returns {String} size and unit string
 *
 * @example
 * const humanReadable = units.bytesToClosestUnit(7801405440);
 * > '7.8 GB'
 */
exports.bytesToClosestUnit = (bytes) => {
  if (_.isNumber(bytes)) {
    return prettyBytes(bytes)
  }

  return null
}

/**
 * @summary Convert days to milliseconds
 * @function
 * @public
 *
 * @param {Number} days - days
 * @returns {Number} milliseconds
 *
 * @example
 * const result = units.daysToMilliseconds(2);
 */
exports.daysToMilliseconds = (days) => {
  return days * MILLISECONDS_IN_A_DAY
}
