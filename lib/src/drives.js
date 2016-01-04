/*
 * Copyright 2016 Resin.io
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

var Promise = require('bluebird');
var drivelist = Promise.promisifyAll(require('drivelist'));

/**
 * @summary List all available removable drives
 * @function
 * @public
 *
 * @fulfil {Object[]} - available removable drives
 * @returns {Promise}
 *
 * @example
 * drives.listRemovable().then(function(drives) {
 *   drives.forEach(function(drive) {
 *     console.log(drive.device);
 *   });
 * });
 */
exports.listRemovable = function() {
  'use strict';

  return drivelist.listAsync().then(function(drives) {
    return drives.filter(function(drive) {
      return !drive.system;
    });
  });
};
