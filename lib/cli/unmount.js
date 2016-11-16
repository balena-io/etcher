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
const Bluebird = require('bluebird');
const childProcess = Bluebird.promisifyAll(require('child_process'));
const os = require('os');

/**
 * @summary Unmount command templates
 * @namespace COMMAND_TEMPLATES
 * @private
 *
 * We make sure that the commands declared here exit
 * successfully even if the drive is not mounted.
 */
const COMMAND_TEMPLATES = {

  /**
   * @property {String} darwin
   * @memberof COMMAND_TEMPLATES
   */
  darwin: '/usr/sbin/diskutil unmountDisk force <%= device %>',

  /**
   * @property {String} linux
   * @memberof COMMAND_TEMPLATES
   *
   * @description
   * If trying to unmount the raw device in Linux, we get:
   * > umount: /dev/sdN: not mounted
   * Therefore we use the ?* glob to make sure umount processes
   * the partitions of sdN independently (even if they contain multiple digits)
   * but not the raw device.
   * We also redirect stderr to /dev/null to ignore warnings
   * if a device is already unmounted.
   * Finally, we also wrap the command in a boolean expression
   * that always evaluates to true to ignore the return code,
   * which is non zero when a device was already unmounted.
   */
  linux: 'umount <%= device %>?* 2>/dev/null || /bin/true'

};

/**
 * @summary Get UNIX unmount command
 * @function
 * @public
 *
 * @param {String} operatingSystem - operating system slug
 * @param {Object} drive - drive object
 * @returns {String} command
 *
 * @example
 * const drivelist = require('drivelist');
 * const os = require('os');
 *
 * drivelist.list((drives) => {
 *   const command = unmount.getUNIXUnmountCommand(os.platform(), drives[0]);
 * });
 */
exports.getUNIXUnmountCommand = (operatingSystem, drive) => {
  return _.template(COMMAND_TEMPLATES[operatingSystem])(drive);
};

/**
 * @summary Unmount drive
 * @function
 * @public
 *
 * @param {Object} drive - drive object
 * @returns {Promise}
 *
 * @example
 * const Bluebird = require('bluebird');
 * const drivelist = Bluebird.promisifyAll(require('drivelist'));
 *
 * drivelist.listAsync().each(unmount.unmountDrive);
 */
exports.unmountDrive = (drive) => {
  const platform = os.platform();

  if (platform === 'win32') {
    const removedrive = Bluebird.promisifyAll(require('removedrive'));
    return Bluebird.each(drive.mountpoints, (mountpoint) => {
      return removedrive.ejectAsync(mountpoint.path);
    });
  }

  const command = exports.getUNIXUnmountCommand(platform, drive);
  return childProcess.execAsync(command);
};
