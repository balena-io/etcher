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

/**
 * @summary Get the explicit boolean form of an argument
 * @function
 * @private
 *
 * @description
 * We refer as "explicit boolean form of an argument" to a boolean
 * argument in either normal or negated form.
 *
 * For example: `--check` and `--no-check`;
 *
 * @param {String} argumentName - argument name
 * @param {Boolean} value - argument value
 * @returns {String} argument
 *
 * @example
 * console.log(cli.getBooleanArgumentForm('check', true));
 * > '--check'
 *
 * @example
 * console.log(cli.getBooleanArgumentForm('check', false));
 * > '--no-check'
 */
exports.getBooleanArgumentForm = (argumentName, value) => {
  const prefix = _.attempt(() => {
    if (!value) {
      return '--no-'
    }

    const SHORT_OPTION_LENGTH = 1
    if (_.size(argumentName) === SHORT_OPTION_LENGTH) {
      return '-'
    }

    return '--'
  })

  return prefix + argumentName
}

/**
 * @summary Get CLI writer arguments
 * @function
 * @public
 *
 * @param {Object} options - options
 * @param {String} options.image - image
 * @param {String} options.device - device
 * @param {String} options.entryPoint - entry point
 * @param {Boolean} [options.validateWriteOnSuccess] - validate write on success
 * @param {Boolean} [options.unmountOnSuccess] - unmount on success
 * @returns {String[]} arguments
 *
 * @example
 * const argv = cli.getArguments({
 *   image: 'path/to/rpi.img',
 *   device: '/dev/disk2'
 *   entryPoint: 'path/to/app.asar',
 *   validateWriteOnSuccess: true,
 *   unmountOnSuccess: true
 * });
 */
exports.getArguments = (options) => {
  const argv = [
    options.entryPoint,
    options.image,
    '--drive',
    options.device,

    // Explicitly set the boolean flag in positive
    // or negative way in order to be on the safe
    // side in case the Etcher CLI changes the
    // default value of these options.
    exports.getBooleanArgumentForm('unmount', options.unmountOnSuccess),
    exports.getBooleanArgumentForm('check', options.validateWriteOnSuccess)

  ]

  return argv
}
