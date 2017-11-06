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

const EventEmitter = require('events').EventEmitter
const _ = require('lodash')
const childProcess = require('child_process')
const ipc = require('node-ipc')
const rendererUtils = require('./renderer-utils')
const cli = require('./cli')
const CONSTANTS = require('./constants')
const EXIT_CODES = require('../shared/exit-codes')
const robot = require('../shared/robot')

/**
 * @summary Writer timeout in milliseconds
 * @constant
 * @private
 *
 * @description
 * If there are no incoming messages over the IPC channel after the time
 * specified below has passed, then we assume the connection has been lost,
 * as this happens occasionally.
 */
const CHILD_WRITER_TIMEOUT_MS = 5000

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
  const emitter = new EventEmitter()

  const argv = cli.getArguments({
    entryPoint: rendererUtils.getApplicationEntryPoint(),
    image,
    device: drive.device,
    validateWriteOnSuccess: options.validateWriteOnSuccess,
    unmountOnSuccess: options.unmountOnSuccess
  })

  // There might be multiple Etcher instances running at
  // the same time, therefore we must ensure each IPC
  // server/client has a different name.
  process.env.IPC_SERVER_ID = `etcher-server-${process.pid}`
  process.env.IPC_CLIENT_ID = `etcher-client-${process.pid}`

  ipc.config.id = process.env.IPC_SERVER_ID
  ipc.config.silent = true
  ipc.serve()

  /**
   * @summary Safely terminate the IPC server
   * @function
   * @private
   *
   * @example
   * terminateServer();
   */
  const terminateServer = () => {
    // Turns out we need to destroy all sockets for
    // the server to actually close. Otherwise, it
    // just stops receiving any further connections,
    // but remains open if there are active ones.
    _.each(ipc.server.sockets, (socket) => {
      socket.destroy()
    })

    ipc.server.stop()
  }

  /**
   * @summary Emit an error to the client
   * @function
   * @private
   *
   * @param {Error} error - error
   *
   * @example
   * emitError(new Error('foo bar'));
   */
  const emitError = (error) => {
    terminateServer()
    emitter.emit('error', error)
  }

  /**
   * @summary Bridge robot message to the child writer caller
   * @function
   * @private
   *
   * @param {String} message - robot message
   *
   * @example
   * bridgeRobotMessage(robot.buildMessage('foo', {
   *   bar: 'baz'
   * }));
   */
  const bridgeRobotMessage = (message) => {
    const parsedMessage = _.attempt(() => {
      if (robot.isMessage(message)) {
        return robot.parseMessage(message)
      }

      // Don't be so strict. If a message doesn't look like
      // a robot message, then make the child writer log it
      // for debugging purposes.
      return robot.parseMessage(robot.buildMessage(robot.COMMAND.LOG, {
        message
      }))
    })

    if (_.isError(parsedMessage)) {
      emitError(parsedMessage)
      return
    }

    try {
      // These are lighweight accessor methods for
      // the properties of the parsed message
      const messageCommand = robot.getCommand(parsedMessage)
      const messageData = robot.getData(parsedMessage)

      // The error object is decomposed by the CLI for serialisation
      // purposes. We compose it back to an `Error` here in order
      // to provide better encapsulation.
      if (messageCommand === robot.COMMAND.ERROR) {
        emitError(robot.recomposeErrorMessage(parsedMessage))
      } else if (messageCommand === robot.COMMAND.LOG) {
        // If the message data is an object and it contains a
        // message string then log the message string only.
        if (_.isPlainObject(messageData) && _.isString(messageData.message)) {
          console.log(messageData.message)
        } else {
          console.log(messageData)
        }
      } else {
        emitter.emit(messageCommand, messageData)
      }
    } catch (error) {
      emitError(error)
    }
  }

  /**
   * [state description]
   * @private
   * @type {Object} state
   * @type {ChildProcess | undefined} [state.child]
   * @type {Socket | undefined} [state.childSocket]
   * @type {Boolean | undefined} [state.isChildRunning]
   * @type {Boolean | undefined} [state.isChildSocketConnected]
   * @type {Object} [state.timeouts]
   * @type {Timeout} [state.timeouts.child]
   * @type {Timeout} [state.timeouts.ipc]
   */
  const state = {
    timeouts: {}
  }

  /**
   * @summary Finish the child writer
   * @function
   * @private
   *
   * @param {Number} code - exit code
   * @returns {Void}
   *
   * @example
   * finish(EXIT_CODES.SUCCESS)
   */
  const finish = (code) => {
    terminateServer()
    _.mapValues(state.timeouts, clearTimeout)

    if (code === EXIT_CODES.CANCELLED) {
      return emitter.emit('done', {
        cancelled: true
      })
    }

    // We shouldn't emit the `done` event manually here
    // since the writer process will take care of it.
    if (code === EXIT_CODES.SUCCESS || code === EXIT_CODES.VALIDATION_ERROR) {
      return null
    }

    return emitError(new Error(`Child process exited with error code: ${code}`))
  }

  /**
   * @summary Terminate the child and IPC channel as an inactivity timeout measure
   * @function
   * @private
   *
   * @description
   * I'll be back
   *
   * @example
   * timeoutTerminator()
   */
  const timeoutTerminator = () => {
    const error = new Error('Write process timed out')
    error.timeout = CHILD_WRITER_TIMEOUT_MS
    error.isChildRunning = state.isChildRunning
    error.childSocket = _.pick(state.childSocket, [
      'connecting',
      'destroyed',
      'bytesRead',
      'bytesWritten'
    ])
    error.childSocket.isConnected = state.isChildSocketConnected
    error.child = _.pick(state.child, [ 'signalCode' ])

    emitter.emit('timeout', error)

    if (state.child) {
      // Remove listeners so no more error popups are spawned
      state.child.removeAllListeners()
      state.child.kill()
    }

    finish(EXIT_CODES.CANCELLED)
  }

  /**
   * @summary Reset the timeout countdown
   * @function
   * @private
   *
   * @param {String[]} timeoutKeys - timeouts object field keys
   *
   * @description
   * Reset the timeout timer for the function that terminates the writer.
   * The terminating function only runs if the child remains unresponsive.
   *
   * @example
   * resetTerminationTimeout([ 'child', 'ipc' ])
   */
  const resetTerminationTimeout = (timeoutKeys) => {
    for (const timeoutKey of timeoutKeys) {
      clearTimeout(state.timeouts[timeoutKey])
      state.timeouts[timeoutKey] = setTimeout(timeoutTerminator, CHILD_WRITER_TIMEOUT_MS)
    }
  }

  ipc.server.on('error', emitError)
  ipc.server.on('message', (message) => {
    resetTerminationTimeout([ 'ipc' ])
    bridgeRobotMessage(message)
  })
  ipc.server.on('connect', (socket) => {
    state.childSocket = socket
    state.isChildSocketConnected = true
  })
  ipc.server.on('disconnect', (socket) => {
    state.isChildSocketConnected = false
  })

  ipc.server.on('start', () => {
    const child = childProcess.fork(CONSTANTS.WRITER_PROXY_SCRIPT, argv, {
      silent: true,
      env: process.env
    })
    state.isChildRunning = true
    state.child = child
    resetTerminationTimeout([ 'child', 'ipc' ])

    child.stdout.on('data', (data) => {
      if (data.toString() === 'ping\n') {
        resetTerminationTimeout([ 'child' ])
      } else {
        console.info(`WRITER: ${data.toString()}`)
      }
    })

    child.stderr.on('data', (data) => {
      bridgeRobotMessage(data.toString())

      // This function causes the `close` event to be emitted
      child.kill()
    })

    child.on('error', emitError)

    child.on('close', finish)
    child.on('exit', () => {
      state.isChildRunning = false
    })
  })

  ipc.server.start()

  return emitter
}
