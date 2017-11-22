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

const EventEmitter = require('events')
const _ = require('lodash')
const childProcess = require('child_process')
const ipc = require('node-ipc')
const rendererUtils = require('./renderer-utils')
const cli = require('./cli')
const CONSTANTS = require('./constants')
const EXIT_CODES = require('../shared/exit-codes')
const robot = require('../shared/robot')
const debug = require('debug')('child-writer')

// There might be multiple Etcher instances running at
// the same time, therefore we must ensure each IPC
// server/client has a different name.
process.env.IPC_SERVER_ID = `etcher-server-${process.pid}`
process.env.IPC_CLIENT_ID = `etcher-client-${process.pid}`

ipc.config.id = process.env.IPC_SERVER_ID
ipc.config.socketRoot = CONSTANTS.TMP_DIRECTORY
ipc.config.silent = true

/**
 * @summary ChildWriter class
 * @class
 * @extends {EventEmitter}
 */
class ChildWriter extends EventEmitter {
  /**
   * @summary ChildWriter constructor
   * @class
   *
   * @example
   * var childWriter = new ChildWriter()
   *
   * childWriterwrite('path/to/rpi.img', {
   *   device: '/dev/disk2'
   * }, {
   *   validateWriteOnSuccess: true,
   *   unmountOnSuccess: true
   * })
   *
   * child.on('done', () => {
   *   console.log('Validation was successful!')
   * })
   */
  constructor () {
    super()

    // NOTE: These need binding to this context,
    // so we can pass them through as event handlers,
    // and remove them at a later stage again
    this.onError = this.onError.bind(this)
    this.onExit = this.onExit.bind(this)
    this.bridgeRobotMessage = this.bridgeRobotMessage.bind(this)

    this.aborting = false
    this.child = null

    this.on('close', () => {
      debug('close')
      this.aborting = false
      ChildWriter.currentInstance = null
    })
  }

  /**
   * @summary Error handler
   * @private
   *
   * @param {Error} error - error
   *
   * @example
   * child.on('error', this.onError)
   */
  onError (error) {
    debug('onError', error)
    error.code = 'EUNEXPECTEDEXIT'
    this.emit('error', error)
    this.abort()
  }

  /**
   * @summary Child process exit handler
   * @private
   *
   * @param {Number} code - exit code
   * @param {String} signal - signal
   *
   * @example
   * child.on('exit', this.onExit)
   */
  onExit (code, signal) {
    debug('onExit', code, signal)

    if (code === EXIT_CODES.CANCELLED) {
      debug('onExit:cancelled')
      this.terminateServer()
      this.emit('done', {
        cancelled: true
      })
      return
    }

    // We shouldn't emit the `done` event manually here
    // since the writer process will take care of it.
    if (code === EXIT_CODES.SUCCESS || code === EXIT_CODES.VALIDATION_ERROR) {
      debug('onExit:success')
      this.terminateServer()
      return
    }

    const error = new Error(`Child process exited with code ${code}, signal ${signal}`)
    error.code = 'EUNEXPECTEDEXIT'
    error.signal = signal

    this.emit('error', error)
    this.terminateServer()
  }

  /**
   * @summary Bridge robot message to the child writer caller
   * @private
   *
   * @param {String} message - robot message
   *
   * @example
   * this.bridgeRobotMessage(robot.buildMessage('foo', {
   *   bar: 'baz'
   * }))
   */
  bridgeRobotMessage (message) {
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
      this.onError(parsedMessage)
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
        this.onError(robot.recomposeErrorMessage(parsedMessage))
      } else if (messageCommand === robot.COMMAND.LOG) {
        // If the message data is an object and it contains a
        // message string then log the message string only.
        if (_.isPlainObject(messageData) && _.isString(messageData.message)) {
          console.log(messageData.message)
        } else {
          console.log(messageData)
        }
      } else {
        this.emit(messageCommand, messageData)
      }
    } catch (error) {
      this.onError(error)
    }
  }

  /**
   * @summary Safely terminate the IPC server
   * @private
   *
   * @param {Function} [callback] - callback
   *
   * @example
   * this.terminateServer()
   */
  terminateServer (callback) {
    debug('terminate-server')

    // NOTE: node-ipc's server never actually emits a "close" event
    // on it's own server, because it's not hooked up, so we try and
    // get a hold of the underlying server;
    // otherwise there isn't much we can do about it
    if (ipc.server.server) {
      ipc.server.server.once('close', () => {
        debug('terminate-server:close')
        this.emit('close')
        callback && callback()
      })
    } else {
      process.nextTick(() => {
        debug('terminate-server:fake-close')
        this.emit('close')
        callback && callback()
      })
    }

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
   * @summary Perform a write
   * @public
   *
   * @param {String} image - image
   * @param {Object} drive - drive
   * @param {Object} options - options
   * @returns {ChildWriter} childWriter
   *
   * @example
   * See `ChildWriter.write()`
   */
  write (image, drive, options) {
    const argv = cli.getArguments({
      entryPoint: rendererUtils.getApplicationEntryPoint(),
      image,
      device: drive.device,
      validateWriteOnSuccess: options.validateWriteOnSuccess,
      unmountOnSuccess: options.unmountOnSuccess
    })

    ipc.serve()

    ipc.server.on('error', this.onError)
    ipc.server.on('message', this.bridgeRobotMessage)

    ipc.server.once('start', () => {
      this.child = childProcess.fork(CONSTANTS.WRITER_PROXY_SCRIPT, argv, {
        silent: true,
        env: process.env
      })

      this.child.stdout.on('data', (data) => {
        console.info(`WRITER: ${data.toString()}`)
      })

      this.child.stderr.on('data', (data) => {
        this.bridgeRobotMessage(data)
      })

      this.child.on('error', this.onError)
      this.child.on('exit', this.onExit)
    })

    ipc.server.start()

    return this
  }

  /**
   * @summary Detach event handlers from the IPC
   * and child to avoid emitting further events
   * @private
   *
   * @example
   * this.detachHandlers()
   */
  detachHandlers () {
    // NOTE: The `ipc.server` is not an instance of EventEmitter,
    // but a PubSub; see https://github.com/RIAEvangelist/event-pubsub
    // Thus the method to remove event handlers is not `.removeListener()`
    ipc.server.off('error', this.onError)
    ipc.server.off('message', this.bridgeRobotMessage)
    this.child.removeListener('exit', this.onExit)
  }

  /**
   * @summary Abort the current writing process
   * @public
   *
   * @param {Function} callback - callback
   *
   * @example
   * childWriter.abort(() => {
   *   console.log('Writing aborted')
   * })
   */
  abort (callback) {
    debug('abort')

    if (this.aborting) {
      debug('abort:in-progress')
      if (_.isFunction(callback)) {
        this.once('close', callback)
      }
      return
    }

    this.aborting = true
    this.detachHandlers()
    this.child.once('exit', (code, signal) => {
      debug('abort:child:exit', code, signal)
      this.emit('done', {
        cancelled: true
      })
      this.terminateServer(callback)
    })

    ipc.server.broadcast('abort', {
      signal: 'SIGINT'
    })
  }
}

/**
 * @summary The currently running instance of the writer
 * @type {ChildWriter}
 */
ChildWriter.currentInstance = null

/**
 * @summary Perform a write
 * @function
 * @public
 *
 * @param {String} image - image
 * @param {Object} drive - drive
 * @param {Object} options - options
 * @returns {ChildWriter} childWriter
 *
 * @example
 * const child = childWriter.write('path/to/rpi.img', {
 *   device: '/dev/disk2'
 * }, {
 *   validateWriteOnSuccess: true,
 *   unmountOnSuccess: true
 * })
 *
 * child.on('progress', (state) => {
 *   console.log(state)
 * })
 *
 * child.on('error', (error) => {
 *   throw error
 * })
 *
 * child.on('done', () => {
 *   console.log('Validation was successful!')
 * })
 */
ChildWriter.write = (image, drive, options) => {
  if (ChildWriter.currentInstance) {
    throw new Error('Write already in progress')
  }
  const writer = new ChildWriter().write(image, drive, options)
  ChildWriter.currentInstance = writer
  return writer
}

/**
 * @summary Abort the writing process
 * and kill the child process chain
 * @param {Function} callback - callback
 * @example
 * ChildWriter.abort(() => {
 *   console.log('Writing aborted')
 * })
 */
ChildWriter.abort = (callback) => {
  if (!ChildWriter.currentInstance) {
    process.nextTick(callback)
    return
  }
  ChildWriter.currentInstance.abort(() => {
    ChildWriter.currentInstance = null
    callback()
  })
}

module.exports = ChildWriter
