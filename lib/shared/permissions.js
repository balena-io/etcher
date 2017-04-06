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

const os = require('os');
const Bluebird = require('bluebird');
const childProcess = Bluebird.promisifyAll(require('child_process'));
const _ = require('lodash');

/**
 * @summary The user id of the UNIX "superuser"
 * @constant
 * @type {Number}
 */
const UNIX_SUPERUSER_USER_ID = 0;

/**
 * @summary Check if the current process is running with elevated permissions
 * @function
 * @public
 *
 * @description
 * This function has been adapted from https://github.com/sindresorhus/is-elevated,
 * which was originally licensed under MIT.
 *
 * We're not using such module directly given that is
 * contains dependencies with dynamic undeclared dependencies,
 * causing a mess when trying to concatenate the code.
 *
 * @fulfil {Boolean} - whether the current process has elevated permissions
 * @returns {Promise}
 *
 * @example
 * permissions.isElevated().then((isElevated) => {
 *   if (isElevated) {
 *     console.log('This process has elevated permissions');
 *   }
 * });
 */
exports.isElevated = () => {
  if (process.platform === 'win32') {

    // `fltmc` is available on WinPE, XP, Vista, 7, 8, and 10
    // Works even when the "Server" service is disabled
    // See http://stackoverflow.com/a/28268802
    return childProcess.execAsync('fltmc')
      .then(_.constant(true))
      .catch({
        code: os.constants.errno.EPERM
      }, _.constant(false));

  }

  return Bluebird.resolve(process.geteuid() === UNIX_SUPERUSER_USER_ID);
};
