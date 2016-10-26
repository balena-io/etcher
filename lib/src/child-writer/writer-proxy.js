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

const Bluebird = require('bluebird');
const childProcess = require('child_process');
const isElevated = Bluebird.promisify(require('is-elevated'));
const ipc = require('node-ipc');
const _ = require('lodash');
const os = require('os');
const sudoPrompt = Bluebird.promisifyAll(require('sudo-prompt'));
const EXIT_CODES = require('../exit-codes');
const packageJSON = require('../../../package.json');
const utils = require('./utils');

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

      return elevator.executeAsync([
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

      ].concat(process.argv), {
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

    const command = _.attempt(() => {
      const commandPrefix = [

        // Some elevation tools, like `pkexec` or `kdesudo`, don't
        // provide a way to preserve the environment, therefore we
        // have to make sure the environment variables we're interested
        // in are manually inherited.
        'env',
        'ELECTRON_RUN_AS_NODE=1',
        `IPC_SERVER_ID=${process.env.IPC_SERVER_ID}`,
        `IPC_CLIENT_ID=${process.env.IPC_CLIENT_ID}`

      ];

      // Executing a binary from inside an AppImage as other user
      // (e.g: `root`) fails with a permission error because of a
      // security measure imposed by FUSE.
      //
      // As a workaround, if we're inside an AppImage, we re-mount
      // the same AppImage to another temporary location without
      // FUSE, and re-call to writer proxy as `root` from there.

      if (process.env.APPIMAGE && process.env.APPDIR) {
        const mountPoint = process.env.APPDIR + '-elevated';

        // Translate the current arguments to
        // point to the new mount location.
        const translatedArguments = _.map(process.argv, (argv) => {
          return argv.replace(process.env.APPDIR, mountPoint);
        });

        // We wrap the command with `sh -c` since it seems
        // the only way to effectively run many commands
        // with a graphical sudo interface,
        return 'sh -c \'' + [

          'mkdir',
          '-p',
          mountPoint,
          '&&',
          'mount',
          '-o',
          'loop',

          // We re-mount the AppImage as "read-only", since `mount`
          // will refuse to mount the same AppImage in two different
          // locations otherwise.
          '-o',
          'ro',

          process.env.APPIMAGE,
          mountPoint,
          '&&'
        ]
        .concat(commandPrefix)
        .concat(utils.escapeArguments(translatedArguments, {
          willBeSurroundedInSingleQuotes: true
        }))
        .concat([
          ';',

          // We need to sleep for a little bit for `umount` to
          // succeed, otherwise it complains with an `EBUSY` error.
          'sleep',
          '1',

          ';',
          'umount',
          mountPoint
        ]).join(' ') + '\'';
      }

      return commandPrefix.concat(
        utils.escapeArguments(process.argv)
      ).join(' ');
    });

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
