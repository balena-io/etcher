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

'use strict';

/**
 * @summary Convert bytes to gigabytes
 * @function
 * @public
 *
 * @param {Number} bytes - bytes
 * @returns {Number} gigabytes
 *
 * @example
 * const result = units.bytesToGigabytes(7801405440);
 */
exports.bytesToGigabytes = (bytes) => {
  return bytes / 1e+9;
};

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
  return bytes / 1e+6;
};
