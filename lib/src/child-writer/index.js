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

const EventEmitter = require('events').EventEmitter;
const childProcess = require('child_process');
const ipc = require('node-ipc');
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
 * child.on('done', () => {
 *   console.log('Validation was successful!');
 * });
 */
exports.write = (image, drive, options) => {
  const emitter = new EventEmitter();

  const argv = utils.getCLIWriterArguments({
    entryPoint: rendererUtils.getApplicationEntryPoint(),
    image: image,
    device: drive.device,
    validateWriteOnSuccess: options.validateWriteOnSuccess,
    unmountOnSuccess: options.unmountOnSuccess
  });

  // There might be multiple Etcher instances running at
  // the same time, therefore we must ensure each IPC
  // server/client has a different name.
  process.env.IPC_SERVER_ID = `etcher-server-${process.pid}`;
  process.env.IPC_CLIENT_ID = `etcher-client-${process.pid}`;

  ipc.config.id = process.env.IPC_SERVER_ID;
  ipc.config.silent = true;
  ipc.serve();

  ipc.server.on('error', (error) => {
    emitter.emit('error', error);
  });

  ipc.server.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data);
    } catch (error) {
      return emitter.emit('error', new Error(`Invalid message: ${data}`));
    }

    if (!message.command || !message.data) {
      return emitter.emit('error', new Error(`Invalid message: ${data}`));
    }

    // The error object is decomposed by the CLI for serialisation
    // purposes. We compose it back to an `Error` here in order
    // to provide better encapsulation.
    if (message.command === 'error') {
      const error = new Error(message.data.message);
      error.code = message.data.code;
      error.description = message.data.description;
      error.stack = message.data.stacktrace;
      return emitter.emit('error', error);
    }

    emitter.emit(message.command, message.data);
  });

  ipc.server.on('start', () => {
    const child = childProcess.fork(CONSTANTS.WRITER_PROXY_SCRIPT, argv, {
      silent: true,
      env: process.env
    });

    child.stdout.on('data', (data) => {
      console.info(`WRITER: ${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
      emitter.emit('error', new Error(data.toString()));

      // This function causes the `close` event to be emitted
      child.kill();

    });

    child.on('error', (error) => {
      ipc.server.stop();
      emitter.emit('error', error);
    });

    child.on('close', (code) => {
      ipc.server.stop();

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

  ipc.server.start();

  return emitter;
};
