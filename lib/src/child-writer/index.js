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

const EventEmitter = require('events').EventEmitter;
const childProcess = require('child_process');
const rendererUtils = require('./renderer-utils');
const utils = require('./utils');
const CONSTANTS = require('./constants');
const EXIT_CODES = require('../exit-codes');

/**
 * @summary Perform a write
 * @function
 * @public
 *
 * @param {String} image - image
 * @param {Object} drive - drive
 * @param {Object} options - options
 * @returns {EventEmitter} event emitter
 *
 * @example
 * const child = childWriter.write('path/to/rpi.img', {
 *   device: '/dev/disk2'
 * }, {
 *   validateWriteOnSuccess: true,
 *   unmountOnSuccess: true
 * });
 *
 * child.on('progress', (state) => {
 *   console.log(state);
 * });
 *
 * child.on('error', (error) => {
 *   throw error;
 * });
 *
 * child.on('done', (results) => {
 *   if (results.passedValidation) {
 *     console.log('Validation was successful!');
 *   }
 * });
 */

exports.write = (drive, options) => {
  const emitter = new EventEmitter();

  utils.getTemporaryLogFilePath().then((logFile) => {
    const argv = utils.getCLIWriterArguments({
      entryPoint: rendererUtils.getApplicationEntryPoint(),
      logFile: logFile,
      release_version: options.release.tag_name,
      release_board: options.release.name.match("(.*)?-(.*)?-")[2],
      device: drive.device,
      validateWriteOnSuccess: options.validateWriteOnSuccess,
      unmountOnSuccess: options.unmountOnSuccess
    });

    // Make writer proxy inherit the temporary log file location
    // while keeping current environment variables intact.
    process.env[CONSTANTS.TEMPORARY_LOG_FILE_ENVIRONMENT_VARIABLE] = logFile;
    console.log(CONSTANTS.WRITER_PROXY_SCRIPT);
    const child = childProcess.fork(CONSTANTS.WRITER_PROXY_SCRIPT, argv, {
      silent: true,
      env: process.env
    });

    child.stdout.on('data', (data) => {
      console.info(`WRITER: ${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
      emitter.emit('error', new Error(data.toString()));
    });

    child.on('message', (message) => {

      // The error object is decomposed by the CLI for serialisation
      // purposes. We compose it back to an `Error` here in order
      // to provide better encapsulation.
      if (message.command === 'error') {
        const error = new Error(message.data.message);
        error.code = message.data.code;
        return emitter.emit('error', error);
      }

      emitter.emit(message.command, message.data);
    });

    child.on('error', (error) => {
      emitter.emit('error', error);
    });

    child.on('close', (code) => {
      if (code === EXIT_CODES.CANCELLED) {
        return emitter.emit('done', {
          cancelled: true
        });
      }

      if (code !== EXIT_CODES.SUCCESS && code !== EXIT_CODES.VALIDATION_ERROR) {
        return emitter.emit('error', new Error(`Child process exitted with error code: ${code}`));
      }
    });
  });

  return emitter;
};
