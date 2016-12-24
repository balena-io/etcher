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

/**
 * Object for checking a drive's constraints.
 * @type {DriveConstraints}
 */
module.exports = class DriveConstraints {
  /**
   * @param {object} drive - The drive whose constraints we want to find out
   */
  constructor(drive) {
    this.drive = drive;
  }

  /**
   * Drive is fixed
   * @returns {boolean}
   */
  isSystemDrive() {
    return this.drive.system;
  }

  /**
   * Image doesn't specify a recommended size or the drive is at least the recommended size
   * @param {object} image The image we check against
   * @returns {boolean}
   */
  isRecommendedSize(image) {
    return this.drive.size >= _.get(image, 'recommendedDriveSize', 0);
  }

  /**
   * Drive's size is at least equal to the image's size
   * @param {object} image - The image we check against
   * @returns {boolean}
   */
  isLargeEnough(image) {
    return this.drive.size >= _.get(image, 'size', 0);
  }

  /**
   * Drive is locked
   * @returns {boolean}
   */
  isLocked() {
    return _.get(this.drive, 'protected', false);
  }

  /**
   * Check if drive isn't lock and it's large enough for the image
   * @param {object} image - The image we check against
   * @returns {boolean}
   */
  isValid(image) {
    return this.isLargeEnough(image) && !this.isLocked(image);
  }
};
