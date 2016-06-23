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

'use strict';

const _ = require('lodash');
const Bluebird = require('bluebird');
const tmp = Bluebird.promisifyAll(require('tmp'));
const packageJSON = require('../../../package.json');

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
 * console.log(utils.getBooleanArgumentForm('check', true));
 * > '--check'
 *
 * @example
 * console.log(utils.getBooleanArgumentForm('check', false));
 * > '--no-check'
 */
exports.getBooleanArgumentForm = (argumentName, value) => {
  const prefix = value ? '--' : '--no-';
  return prefix + argumentName;
};

/**
 * @summary Get CLI writer arguments
 * @function
 * @public
 *
 * @param {Object} options - options
 * @param {String} options.image - image
 * @param {String} options.device - device
 * @param {String} options.entryPoint - entry point
 * @param {String} [options.logFile] - log file
 * @param {Boolean} [options.validateWriteOnSuccess] - validate write on success
 * @param {Boolean} [options.unmountOnSuccess] - unmount on success
 * @returns {String[]} arguments
 *
 * @example
 * const argv = utils.getCLIWriterArguments({
 *   image: 'path/to/rpi.img',
 *   device: '/dev/disk2'
 *   entryPoint: 'path/to/app.asar',
 *   validateWriteOnSuccess: true,
 *   unmountOnSuccess: true
 * });
 */
exports.getCLIWriterArguments = (options) => {
  const argv = [
    options.entryPoint,
    options.image,
    '--robot',
    '--drive',
    options.device,

    // Explicitly set the boolen flag in positive
    // or negative way in order to be on the safe
    // side in case the Etcher CLI changes the
    // default value of these options.
    exports.getBooleanArgumentForm('unmount', options.unmountOnSuccess),
    exports.getBooleanArgumentForm('check', options.validateWriteOnSuccess)

  ];

  // This temporarily workarounds a Windows Electron issue where
  // we can't pipe `stdout`/`stderr` with system pipes.
  // See: https://github.com/electron/electron/issues/5715
  if (options.logFile) {
    argv.push('--log', options.logFile);
  }

  return argv;
};

/**
 * @summary Escape white spaces from arguments
 * @function
 * @public
 *
 * @param {String[]} argv - argv
 * @returns {String[]} escaped arguments
 *
 * @example
 * const escapedArguments = utils.escapeWhiteSpacesFromArguments(process.argv);
 */
exports.escapeWhiteSpacesFromArguments = (argv) => {
  return _.map(argv, (argument) => {
    return argument.replace(/\s/g, '\\ ');
  });
};

/**
 * @summary Get a temporary log file path
 * @function
 * @public
 *
 * @fulfil {String} - file path
 * @returns {Promise}
 *
 * @example
 * utils.getTemporaryLogFilePath().then((filePath) => {
 *   console.log(filePath);
 * });
 */
exports.getTemporaryLogFilePath = () => {
  return tmp.fileAsync({
    prefix: `${packageJSON.name}-`,
    postfix: '.log'
  });
};
