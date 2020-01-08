/*
 * Copyright 2017 balena.io
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

/* eslint-disable lodash/prefer-lodash-method,quotes,no-magic-numbers,require-jsdoc */

'use strict'

const bindings = require('bindings')
const Bluebird = require('bluebird')
const childProcess = Bluebird.promisifyAll(require('child_process'))
const fs = require('fs')
const _ = require('lodash')
const os = require('os')
const semver = require('semver')
const sudoPrompt = Bluebird.promisifyAll(require('sudo-prompt'))
const { promisify } = require('util')

const errors = require('./errors')

const { tmpFileDisposer } = require('./utils')
// eslint-disable-next-line node/no-missing-require
const { sudo: catalinaSudo } = require('./catalina-sudo/sudo')

const writeFileAsync = promisify(fs.writeFile)

/**
 * @summary The user id of the UNIX "superuser"
 * @constant
 * @type {Number}
 */
const UNIX_SUPERUSER_USER_ID = 0

/**
 * @summary Check if the current process is running with elevated permissions
 * @function
 * @public
 *
 * @description
 * This function has been adapted from https://github.com/sindresorhus/is-elevated,
 * which was originally licensed under MIT.
 *
 * We're not using such module directly given that it
 * contains dependencies with dynamic undeclared dependencies,
 * causing a mess when trying to concatenate the code.
 *
 * @fulfil {Boolean} - whether the current process has elevated permissions
 * @returns {Promise}
 *
 * @example
 * permissions.isElevated().then((isElevated) => {
 *   if (isElevated) {
 *     console.log('This process has elevated permissions');
 *   }
 * });
 */
exports.isElevated = () => {
  if (os.platform() === 'win32') {
    // `fltmc` is available on WinPE, XP, Vista, 7, 8, and 10
    // Works even when the "Server" service is disabled
    // See http://stackoverflow.com/a/28268802
    return childProcess.execAsync('fltmc')
      .then(_.constant(true))
      .catch({
        code: os.constants.errno.EPERM
      }, _.constant(false))
  }

  return Bluebird.resolve(process.geteuid() === UNIX_SUPERUSER_USER_ID)
}

/**
 * @summary Check if the current process is running with elevated permissions
 * @function
 * @public
 *
 * @description
 *
 * @returns {Boolean}
 *
 * @example
 * permissions.isElevatedUnixSync()
 *   if (isElevated) {
 *     console.log('This process has elevated permissions');
 *   }
 * });
 */
exports.isElevatedUnixSync = () => {
  return (process.geteuid() === UNIX_SUPERUSER_USER_ID)
}

const escapeSh = (value) => {
  // Make sure it's a string
  // Replace ' -> '\'' (closing quote, escaped quote, opening quote)
  // Surround with quotes
  return `'${String(value).replace(/'/g, "'\\''")}'`
}

const escapeParamCmd = (value) => {
  // Make sure it's a string
  // Escape " -> \"
  // Surround with double quotes
  return `"${String(value).replace(/"/g, '\\"')}"`
}

const setEnvVarSh = (value, name) => {
  return `export ${name}=${escapeSh(value)}`
}

const setEnvVarCmd = (value, name) => {
  return `set "${name}=${String(value)}"`
}

// Exported for tests
exports.createLaunchScript = (command, argv, environment) => {
  const isWindows = os.platform() === 'win32'
  const lines = []
  if (isWindows) {
    // Switch to utf8
    lines.push('chcp 65001')
  }
  const [ setEnvVarFn, escapeFn ] = isWindows ? [ setEnvVarCmd, escapeParamCmd ] : [ setEnvVarSh, escapeSh ]
  lines.push(..._.map(environment, setEnvVarFn))
  lines.push([ command, ...argv ].map(escapeFn).join(' '))
  return lines.join(os.EOL)
}

const elevateScriptWindows = async (path) => {
  // 'elevator' imported here as it only exists on windows
  // TODO: replace this with sudo-prompt once https://github.com/jorangreef/sudo-prompt/issues/96 is fixed
  const elevateAsync = promisify(bindings({ bindings: 'elevator' }).elevate)

  // '&' needs to be escaped here (but not when written to a .cmd file)
  const cmd = [ 'cmd', '/c', escapeParamCmd(path).replace(/&/g, '^&') ]
  const { cancelled } = await elevateAsync(cmd)
  return { cancelled }
}

const elevateScriptUnix = async (path, name) => {
  const cmd = [ 'bash', escapeSh(path) ].join(' ')
  const [ , stderr ] = await sudoPrompt.execAsync(cmd, { name })
  if (!_.isEmpty(stderr)) {
    throw errors.createError({ title: stderr })
  }
  return { cancelled: false }
}

const elevateScriptCatalina = async (path) => {
  const cmd = [ 'bash', escapeSh(path) ].join(' ')
  try {
    const { cancelled } = await catalinaSudo(cmd)
    return { cancelled }
  } catch (error) {
    return errors.createError({ title: error.stderr })
  }
}

/**
 * @summary Elevate a command
 * @function
 * @public
 *
 * @param {String[]} command - command arguments
 * @param {Object} options - options
 * @param {String} options.applicationName - application name
 * @param {Object} options.environment - environment variables
 * @fulfil {Object} - elevation results
 * @returns {Promise}
 *
 * @example
 * permissions.elevateCommand([ 'foo', 'bar' ], {
 *   applicationName: 'My App',
 *   environment: {
 *     FOO: 'bar'
 *   }
 * }).then((results) => {
 *   if (results.cancelled) {
 *     console.log('Elevation has been cancelled');
 *   }
 * });
 */
exports.elevateCommand = async (command, options) => {
  if (await exports.isElevated()) {
    await childProcess.execFileAsync(command[0], command.slice(1), { env: options.environment })
    return { cancelled: false }
  }
  const isWindows = os.platform() === 'win32'
  const launchScript = exports.createLaunchScript(command[0], command.slice(1), options.environment)
  return Bluebird.using(tmpFileDisposer({ postfix: '.cmd' }), async ({ path }) => {
    await writeFileAsync(path, launchScript)
    if (isWindows) {
      return elevateScriptWindows(path)
    }
    if (os.platform() === 'darwin' && semver.compare(os.release(), '19.0.0') >= 0) {
      // >= macOS Catalina
      return elevateScriptCatalina(path)
    }
    try {
      return await elevateScriptUnix(path, options.applicationName)
    } catch (error) {
      // We're hardcoding internal error messages declared by `sudo-prompt`.
      // There doesn't seem to be a better way to handle these errors, so
      // for now, we should make sure we double check if the error messages
      // have changed every time we upgrade `sudo-prompt`.
      console.log('error', error)
      if (_.includes(error.message, 'is not in the sudoers file')) {
        throw errors.createUserError({
          title: "Your user doesn't have enough privileges to proceed",
          description: 'This application requires sudo privileges to be able to write to drives'
        })
      } else if (_.startsWith(error.message, 'Command failed:')) {
        throw errors.createUserError({
          title: 'The elevated process died unexpectedly',
          description: `The process error code was ${error.code}`
        })
      } else if (error.message === 'User did not grant permission.') {
        return { cancelled: true }
      } else if (error.message === 'No polkit authentication agent found.') {
        throw errors.createUserError({
          title: 'No polkit authentication agent found',
          description: 'Please install a polkit authentication agent for your desktop environment of choice to continue'
        })
      }
      throw error
    }
  })
}
