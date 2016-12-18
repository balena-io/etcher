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

const _ = require('lodash');

module.exports = class DriveConstraints {

  /**
   * @summary Check if a drive is locked
   * @function
   * @public
   *
   * @description
   * This usually points out a locked SD Card.
   *
   * @param {Object} drive - drive
   * @returns {Boolean} whether the drive is locked
   *
   * @example
   * if (DriveConstraintsModel.isDriveLocked({
   *   device: '/dev/disk2',
   *   name: 'My Drive',
   *   size: 123456789,
   *   protected: true
   * })) {
   *   console.log('This drive is locked (e.g: write-protected)');
   * }
   */
  isDriveLocked(drive) {
    return _.get(drive, 'protected', false);
  }

  /**
   * @summary Check if a drive is a system drive
   * @function
   * @public
   * @param {Object} drive - drive
   * @returns {Boolean} whether the drive is a system drive
   *
   * @example
   * if (DriveConstraintsModel.isSystemDrive({
   *   device: '/dev/disk2',
   *   name: 'My Drive',
   *   size: 123456789,
   *   protected: true,
   *   system: true
   * })) {
   *   console.log('This drive is a system drive!');
   * }
   */
  isSystemDrive(drive) {
    return Boolean(drive.system);
  }
};

