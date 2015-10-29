/* The MIT License
 *
 * Copyright (c) 2015 Resin.io. https://resin.io.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var drivelist = require('drivelist');

/**
 * @summary List all available drives
 * @function
 * @public
 *
 * @description
 * See https://github.com/resin-io/drivelist
 *
 * @fulfil {Object[]} - available drives
 * @returns {Promise}
 *
 * @example
 * drives.list().then(function(drives) {
 *   drives.forEach(function(drive) {
 *     console.log(drive.device);
 *   });
 * });
 */
exports.list = function() {
  'use strict';

  return new Promise(function(resolve, reject) {
    drivelist.list(function(error, drives) {
      if (error) {
        return reject(error);
      }
      return resolve(drives);
    });
  });
};

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

  return exports.list().then(function(drives) {
    return drives.filter(function(drive) {
      return !drive.system;
    });
  });
};
