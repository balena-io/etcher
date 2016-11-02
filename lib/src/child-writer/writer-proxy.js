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
const isElevated = Bluebird.promisify(require('is-elevated'));
const ipc = require('node-ipc');
const _ = require('lodash');
const os = require('os');
const path = require('path');
const sudoPrompt = Bluebird.promisifyAll(require('sudo-prompt'));
const EXIT_CODES = require('../exit-codes');
const packageJSON = require('../../../package.json');

// This script is in charge of spawning the writer process and
// ensuring it has the necessary privileges. It might look a bit
// complex at first sight, but this is only because elevation
// modules don't work in a spawn/fork fashion.
//
// This script spawns the writer process and redirects its `stdout`
// and `stderr` to the parent process using IPC communication,
// taking care of the writer elevation as needed.

const EXECUTABLE = process.argv[0];
const ETCHER_ARGUMENTS = process.argv.slice(2);

return isElevated().then((elevated) => {

  if (!elevated) {
    console.log('Attempting to elevate');

    if (os.platform() === 'win32') {
      const elevator = Bluebird.promisifyAll(require('elevator'));

      const commandArguments = [
        'set',
        'ELECTRON_RUN_AS_NODE=1',
        '&&',
        'set',
        `IPC_SERVER_ID=${process.env.IPC_SERVER_ID}`,
        '&&',
        'set',
        `IPC_CLIENT_ID=${process.env.IPC_CLIENT_ID}`,
        '&&',

        // This is a trick to make the binary afterwards catch
        // the environment variables set just previously.
        'call'

      ].concat(process.argv);

      // For debugging purposes
      console.log(`Running: ${commandArguments.join(' ')}`);

      return elevator.executeAsync(commandArguments, {
        hidden: true,
        terminating: true,
        doNotPushdCurrentDirectory: true,
        waitForTermination: true
      }).catch({
        code: 'ELEVATE_CANCELLED'
      }, () => {
        process.exit(EXIT_CODES.CANCELLED);
      });
    }

    const commandArguments = _.attempt(() => {
      const commandPrefix = [

        // Some elevation tools, like `pkexec` or `kdesudo`, don't
        // provide a way to preserve the environment, therefore we
        // have to make sure the environment variables we're interested
        // in are manually inherited.
        'env',
        'ELECTRON_RUN_AS_NODE=1',
        `IPC_SERVER_ID=${process.env.IPC_SERVER_ID}`,
        `IPC_CLIENT_ID=${process.env.IPC_CLIENT_ID}`,

        // This environment variable prevents the AppImages
        // desktop integration script from presenting the
        // "installation" dialog.
        'SKIP=1'

      ];

      if (process.env.APPIMAGE && process.env.APPDIR) {

        // Translate the current arguments to point to the AppImage
        // Relative paths are resolved from `/tmp/.mount_XXXXXX/usr`
        const translatedArguments = _.map(_.tail(process.argv), (argv) => {
          return argv.replace(path.join(process.env.APPDIR, 'usr/'), '');
        });

        return commandPrefix
        .concat([ process.env.APPIMAGE ])
        .concat(translatedArguments);
      }

      return commandPrefix.concat(process.argv);
    });

    const command = _.join(_.map(commandArguments, (argument) => {
      return `"${argument.replace(/(")/g, '\\$1')}"`;
    }), ' ');

    // For debugging purposes
    console.log(`Running: ${command}`);

    return sudoPrompt.execAsync(command, {
      name: packageJSON.displayName
    }).then((stdout, stderr) => {
      if (!_.isEmpty(stderr)) {
        throw new Error(stderr);
      }
    }).catch({
      message: 'User did not grant permission.'
    }, () => {
      process.exit(EXIT_CODES.CANCELLED);
    });
  }

  console.log('Re-spawning with elevation');

  return new Bluebird((resolve, reject) => {
    ipc.config.id = process.env.IPC_CLIENT_ID;
    ipc.config.silent = true;
    ipc.connectTo(process.env.IPC_SERVER_ID, () => {
      ipc.of[process.env.IPC_SERVER_ID].on('error', reject);
      ipc.of[process.env.IPC_SERVER_ID].on('connect', () => {
        const child = childProcess.spawn(EXECUTABLE, ETCHER_ARGUMENTS);
        child.on('error', reject);
        child.on('close', resolve);

        const emitMessage = (data) => {
          ipc.of[process.env.IPC_SERVER_ID].emit('message', data.toString());
        };

        child.stdout.on('data', emitMessage);
        child.stderr.on('data', emitMessage);
      });
    });
  }).then((exitCode) => {
    process.exit(exitCode);
  });
}).catch((error) => {
  console.error(error);
  process.exit(EXIT_CODES.GENERAL_ERROR);
});
