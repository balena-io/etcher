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

const os = require('os')

const ROOT_UID = 0
if (os.platform() === 'linux' && process.getuid() !== ROOT_UID) {
  const Bluebird = require('bluebird')
  const childProcess = Bluebird.promisifyAll(require('child_process'))
  const fs = Bluebird.promisifyAll(require('fs'))

  const argvString = process.argv.join(' ')
  const command = `/usr/bin/sudo -n -E -- ${argvString}`
  childProcess.execAsync(command).catch((error) => {
    const errorLines = error.message.split('\n')
    if (errorLines[1].startsWith('sudo:')) {
      Bluebird.any([ '/usr/bin/kdesudo', '/usr/bin/pkexec' ].map((cmd) => {
        return fs.statAsync(cmd).then((statResult) => {
          return cmd
        })
      })).then((sudoCmd) => {
        const cmd = [ sudoCmd ]

        if (sudoCmd.endsWith('pkexec')) {
          cmd.push('--disable-internal-agent')
        }

        cmd.push(argvString)

        childProcess.execAsync(cmd.join(' '), {
          cwd: `${__dirname}/../`,
          env: {
            DISPLAY: process.env.DISPLAY,
            XAUTHORITY: process.env.XAUTHORITY,
            PATH: process.env.PATH
          }
        }).then((stdout, stderr) => {
          console.log(stdout)
        })
      }).catch((error) => {
        console.log('Please ensure kdesudo or pkexec are installed.')
      })
    }
  })

  // eslint-disable-next-line object-curly-newline
  const { displayName } = require('../package.json')

  return
}

// See http://electron.atom.io/docs/v0.37.7/api/environment-variables/#electronrunasnode
//
// Notice that if running electron with `ELECTRON_RUN_AS_NODE`, the binary
// *won't* attempt to load the `app.asar` application by default, therefore
// if passing `ELECTRON_RUN_AS_NODE`, you have to pass the path to the asar
// or the entry point file (this file) manually as an argument.
//
// We also consider `ATOM_SHELL_INTERNAL_RUN_AS_NODE`, which is basically
// an older equivalent of `ELECTRON_RUN_AS_NODE` that still gets set when
// using `child_process.fork()`.
if (process.env.ELECTRON_RUN_AS_NODE || process.env.ATOM_SHELL_INTERNAL_RUN_AS_NODE) {
  require('./cli/etcher')
} else {
  require('./gui/etcher')
}
