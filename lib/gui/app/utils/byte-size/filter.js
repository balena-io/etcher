/*
 * Copyright 2016 balena.io
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

const units = require('../../../../shared/units')

module.exports = () => {
  /**
   * @summary Convert bytes to the closest unit
   * @function
   * @public
   *
   * @param {Number} bytes - bytes
   * @returns {String} formatted string containing size and unit
   *
   * @example
   * {{ 7801405440 | closestUnit }}
   */
  return units.bytesToClosestUnit
}
