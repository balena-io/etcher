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

const Bluebird = require('bluebird');
const childProcess = require('child_process');
const ipc = require('node-ipc');
const _ = require('lodash');
const os = require('os');
const path = require('path');
const utils = require('./utils');
const EXIT_CODES = require('../shared/exit-codes');
const robot = require('../shared/robot');
const permissions = require('../shared/permissions');
const packageJSON = require('../../package.json');

// This script is in charge of spawning the writer process and
// ensuring it has the necessary privileges. It might look a bit
// complex at first sight, but this is only because elevation
// modules don't work in a spawn/fork fashion.
//
// This script spawns the writer process and redirects its `stdout`
// and `stderr` to the parent process using IPC communication,
// taking care of the writer elevation as needed.

/**
 * @summary The Etcher executable file path
 * @constant
 * @private
 * @type {String}
 */
const executable = _.first(process.argv);

/**
 * @summary The first index that represents an actual option argument
 * @constant
 * @private
 * @type {Number}
 *
 * @description
 * The first arguments are usually the program executable itself, etc.
 */
const OPTIONS_INDEX_START = 2;

/**
 * @summary The list of Etcher argument options
 * @constant
 * @private
 * @type {String[]}
 */
const etcherArguments = process.argv.slice(OPTIONS_INDEX_START);

return permissions.isElevated().then((elevated) => {

  if (!elevated) {
    console.log('Attempting to elevate');

    const commandArguments = _.attempt(() => {
      if (os.platform() === 'linux' && process.env.APPIMAGE && process.env.APPDIR) {

        // Translate the current arguments to point to the AppImage
        // Relative paths are resolved from `/tmp/.mount_XXXXXX/usr`
        const translatedArguments = _.chain(process.argv)
          .tail()
          .invokeMap('replace', path.join(process.env.APPDIR, 'usr/'), '')
          .value();

        return _.concat([ process.env.APPIMAGE ], translatedArguments);
      }

      return process.argv;
    });

    // For debugging purposes
    console.log(`Running: ${commandArguments.join(' ')}`);

    return permissions.elevateCommand(commandArguments, {
      applicationName: packageJSON.build.productName,
      environment: {
        ELECTRON_RUN_AS_NODE: 1,
        IPC_SERVER_ID: process.env.IPC_SERVER_ID,
        IPC_CLIENT_ID: process.env.IPC_CLIENT_ID,

        // This environment variable prevents the AppImages
        // desktop integration script from presenting the
        // "installation" dialog.
        SKIP: 1

      }
    }).then((results) => {
      if (results.cancelled) {
        process.exit(EXIT_CODES.CANCELLED);
      }
    });
  }

  console.log('Re-spawning with elevation');

  return new Bluebird((resolve, reject) => {
    ipc.config.id = process.env.IPC_CLIENT_ID;
    ipc.config.silent = true;

    // > If set to 0, the client will NOT try to reconnect.
    // See https://github.com/RIAEvangelist/node-ipc/
    //
    // The purpose behind this change is for this process
    // to emit a "disconnect" event as soon as the GUI
    // process is closed, so we can kill the CLI as well.
    ipc.config.stopRetrying = 0;

    ipc.connectTo(process.env.IPC_SERVER_ID, () => {
      ipc.of[process.env.IPC_SERVER_ID].on('error', reject);
      ipc.of[process.env.IPC_SERVER_ID].on('connect', () => {

        const child = childProcess.spawn(executable, etcherArguments, {
          env: {

            // The CLI might call operating system utilities (like `diskutil`),
            // so we must ensure the `PATH` is inherited.
            PATH: process.env.PATH,

            ELECTRON_RUN_AS_NODE: 1,
            ETCHER_CLI_ROBOT: 1,

            // Enable extra logging from mountutils
            // See https://github.com/resin-io-modules/mountutils
            MOUNTUTILS_DEBUG: 1

          }
        });

        ipc.of[process.env.IPC_SERVER_ID].on('disconnect', _.bind(child.kill, child));
        child.on('error', reject);
        child.on('close', resolve);

        /**
         * @summary Emit an object message to the IPC server
         * @function
         * @private
         *
         * @param {Buffer} data - json message data
         *
         * @example
         * emitMessage(Buffer.from(JSON.stringify({
         *   foo: 'bar'
         * })));
         */
        const emitMessage = (data) => {

          // Output from stdout/stderr coming from the CLI might be buffered,
          // causing several progress lines to come up at once as single message.
          // Trying to parse multiple JSON objects separated by new lines will
          // of course make the parser confused, causing errors later on.
          _.each(utils.splitObjectLines(data.toString()), (object) => {
            ipc.of[process.env.IPC_SERVER_ID].emit('message', object);
          });

        };

        child.stdout.on('data', emitMessage);
        child.stderr.on('data', emitMessage);
      });
    });
  }).then((exitCode) => {
    process.exit(exitCode);
  });
}).catch((error) => {
  robot.printError(error);
  process.exit(EXIT_CODES.GENERAL_ERROR);
});
