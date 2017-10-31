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
  const electron = require('electron')
  const os = require('os')
  const _ = require('lodash')
  const Bluebird = require('bluebird')
  const commandExists = Bluebird.promisify(require('command-exists'))
  const childProcess = require('child_process')
  const permissions = require('./shared/permissions')
  const errors = require('./shared/errors')
  const EXIT_CODES = require('./shared/exit-codes')
  const packageJSON = require('../package.json')
  const messages = require('./shared/messages')

  const MESSAGE = messages.info.providePassword({
    displayName: packageJSON.displayName
  })

  const ELEVATOR_COMMANDS = [
    {
      name: 'gksudo',
      options: [ '--preserve-env', '--message', MESSAGE ]
    },
    {
      name: 'kdesudo',
      options: [ '--comment', MESSAGE, '--' ]
    },
    {
      name: 'beesu',
      options: [ '--preserve-environment' ]
    }
  ]

  if (_.includes([ 'win32', 'darwin' ], os.platform())) {
    require('./gui/etcher')
  } else {
    permissions.isElevated().then((isElevated) => {
      if (isElevated) {
        require('./gui/etcher')
        return Bluebird.resolve()
      }

      return Bluebird.any(_.map(ELEVATOR_COMMANDS, (command) => {
        return commandExists(command.name).then((exists) => {
          if (!exists) {
            throw new Error(`Command does not exist: ${command.name}`)
          }

          return command
        })
      })).then((command) => {
        return new Bluebird((resolve, reject) => {
          const argv = process.env.APPIMAGE ? [ process.env.APPIMAGE ] : process.argv
          const options = command.options.concat([ 'env', 'SKIP=1' ]).concat(argv)

          console.log(`Running ${command.name}`)

          const child = childProcess.spawn(command.name, options, {
            detached: true,
            env: process.env
          })

          child.stdout.on('data', (data) => {
            console.log(data.toString())
          })

          child.stderr.on('data', (data) => {
            console.error(data.toString())
          })

          child.on('exit', () => {
            electron.app.quit()
          })

          child.on('error', reject)
        })
      }).catch(Bluebird.AggregateError, () => {
        const commands = _.map(ELEVATOR_COMMANDS, 'name')
        const formattedCommands = `${_.initial(commands).join(', ')}, or ${_.last(commands)}`
        throw errors.createUserError({
          title: 'Can\'t elevate the application',
          description: `Please ensure you have either ${formattedCommands} available in your system`
        })
      })
    }).catch((error) => {
      electron.dialog.showErrorBox(errors.getTitle(error), errors.getDescription(error))
      electron.app.exit(EXIT_CODES.GENERAL_ERROR)
    })
  }
}
