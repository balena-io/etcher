/*
 * Copyright 2017 resin.io
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
const nativeModule = require('./native-module')
const Bluebird = require('bluebird')
const childProcess = Bluebird.promisifyAll(require('child_process'))
const sudoPrompt = Bluebird.promisifyAll(require('sudo-prompt'))
const commandJoin = require('command-join')
const _ = require('lodash')
const errors = require('./errors')

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

/**
 * @summary Get environment command prefix
 * @function
 * @private
 *
 * @param {Object} environment - environment map
 * @returns {String[]} command arguments
 *
 * @example
 * const commandPrefix = permissions.getEnvironmentCommandPrefix({
 *   FOO: 'bar',
 *   BAR: 'baz'
 * });
 *
 * childProcess.execSync(_.join(_.concat(commandPrefix, [ 'mycommand' ]), ' '));
 */
exports.getEnvironmentCommandPrefix = (environment) => {
  const isWindows = os.platform() === 'win32'

  if (_.isEmpty(environment)) {
    return []
  }

  const argv = _.flatMap(environment, (value, key) => {
    if (_.isNil(value)) {
      return []
    }

    if (isWindows) {
      // Doing something like `set foo=bar &&` (notice
      // the space before the first ampersand) would
      // cause the environment variable's value to
      // contain a trailing space.
      // See https://superuser.com/a/57726
      return [ 'set', `${key}=${value}&&` ]
    }

    return [ `${key}=${value}` ]
  })

  if (isWindows) {
    // This is a trick to make the binary afterwards catch
    // the environment variables set just previously.
    return _.concat(argv, [ 'call' ])
  }

  return _.concat([ 'env' ], argv)
}

/**
 * @summary Quote a string
 * @function
 * @private
 *
 * @param {String} string - input string
 * @returns {String} quoted string
 *
 * @example
 * const result = quote('foo');
 */
const quoteString = (string) => {
  return `"${string}"`
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
exports.elevateCommand = (command, options) => {
  const isWindows = os.platform() === 'win32'

  const prefixedCommand = _.concat(
    exports.getEnvironmentCommandPrefix(options.environment),
    _.map(command, (string) => {
      return isWindows ? quoteString(string) : string
    })
  )

  if (isWindows) {
    const elevator = Bluebird.promisifyAll(nativeModule.load('elevator'))
    return elevator.elevateAsync([
      'cmd.exe',
      '/c',
      quoteString(_.join(prefixedCommand, ' '))
    ]).then((results) => {
      return {
        cancelled: results.cancelled
      }
    })
  }

  return sudoPrompt.execAsync(commandJoin(prefixedCommand), {
    name: options.applicationName
  }).then((stdout, stderr) => {
    if (!_.isEmpty(stderr)) {
      throw errors.createError({
        title: stderr
      })
    }

    return {
      cancelled: false
    }

  // We're hardcoding internal error messages declared by `sudo-prompt`.
  // There doesn't seem to be a better way to handle these errors, so
  // for now, we should make sure we double check if the error messages
  // have changed every time we upgrade `sudo-prompt`.
  }).catch((error) => {
    console.log('error', error.cause)
    return _.includes(error.message, 'is not in the sudoers file')
  }, () => {
    throw errors.createUserError({
      title: 'Your user doesn\'t have enough privileges to proceed',
      description: 'This application requires sudo privileges to be able to write to drives'
    })
  }).catch((error) => {
    return _.startsWith(error.message, 'Command failed:')
  }, (error) => {
    throw errors.createUserError({
      title: 'The elevated process died unexpectedly',
      description: `The process error code was ${error.code}`
    })
  }).catch({
    message: 'User did not grant permission.'
  }, () => {
    return {
      cancelled: true
    }
  }).catch({
    message: 'No polkit authentication agent found.'
  }, () => {
    throw errors.createUserError({
      title: 'No polkit authentication agent found',
      description: 'Please install a polkit authentication agent for your desktop environment of choice to continue'
    })
  })
}
