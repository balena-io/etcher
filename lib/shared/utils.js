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
 * @summary Drive comparer function used to sort drives
 *
 * @description
 * Two criteria are used for comparison:
 * - Removable drives are smaller than fixed drives
 * - Within same type, drives are compared by size
 *
 * @private
 * @param {Object} drive1 Drive object (as returned by `drivelist`)
 * @param {Object} drive2 Drive object (as returned by `drivelist`)
 * @returns {number}
 */
exports.driveComparer = (drive1, drive2) => {
  // Removable drives first
  if (drive1.system !== drive2.system) {
    return drive1.system - drive2.system;
  }
  return drive1.size - drive2.size;
};
