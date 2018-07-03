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

const Bluebird = require('bluebird')
const _ = require('lodash')
const ipc = require('node-ipc')
const sdk = require('etcher-sdk')
const EXIT_CODES = require('../../shared/exit-codes')
const errors = require('../../shared/errors')

ipc.config.id = process.env.IPC_CLIENT_ID
ipc.config.socketRoot = process.env.IPC_SOCKET_ROOT

// NOTE: Ensure this isn't disabled, as it will cause
// the stdout maxBuffer size to be exceeded when flashing
ipc.config.silent = true

// > If set to 0, the client will NOT try to reconnect.
// See https://github.com/RIAEvangelist/node-ipc/
//
// The purpose behind this change is for this process
// to emit a "disconnect" event as soon as the GUI
// process is closed, so we can kill this process as well.
ipc.config.stopRetrying = 0

const IPC_SERVER_ID = process.env.IPC_SERVER_ID

/**
 * @summary Send a log debug message to the IPC server
 * @function
 * @private
 *
 * @param {String} message - message
 *
 * @example
 * log('Hello world!')
 */
const log = (message) => {
  ipc.of[IPC_SERVER_ID].emit('log', message)
}

/**
 * @summary Terminate the child writer process
 * @function
 * @private
 *
 * @param {Number} [code=0] - exit code
 *
 * @example
 * terminate(1)
 */
const terminate = (code) => {
  ipc.disconnect(IPC_SERVER_ID)
  process.nextTick(() => {
    process.exit(code || EXIT_CODES.SUCCESS)
  })
}

/**
 * @summary Handle a child writer error
 * @function
 * @private
 *
 * @param {Error} error - error
 *
 * @example
 * handleError(new Error('Something bad happened!'))
 */
const handleError = (error) => {
  ipc.of[IPC_SERVER_ID].emit('error', errors.toJSON(error))
  terminate(EXIT_CODES.GENERAL_ERROR)
}

function lastMapValue(map) {
  let value
  for (value of map.values()){
  }
  return value
}

function writeAndValidate(source, destinations, verify, onProgress, onFail, onFinish, onError) {
  return source.getInnerSource()
  .then((innerSource) => {
    return sdk.multiWrite.pipeSourceToDestinations(
      innerSource,
      destinations,
      onFail,
      onProgress,
      verify,
    )
  })
  .then(({ failures, bytesWritten }) => {
    // If all destinations errored, treat the last fail as an error
    if (failures.size === destinations.length) {
      throw lastMapValue(failures)
    }
    const result = {
      bytesWritten,
      devices: {
        failed: failures.size,
        successful: destinations.length - failures.size,
      },
      errors: []
    }
    for (const [ destination, error ] of failures) {
      error.device = destination.drive.device
      result.errors.push(error)
    }
    onFinish(result)
  })
  .catch(onError)
}

ipc.connectTo(IPC_SERVER_ID, () => {
  process.once('uncaughtException', handleError)

  // Gracefully exit on the following cases. If the parent
  // process detects that child exit successfully but
  // no flashing information is available, then it will
  // assume that the child died halfway through.

  process.once('SIGINT', () => {
    terminate(EXIT_CODES.SUCCESS)
  })

  process.once('SIGTERM', () => {
    terminate(EXIT_CODES.SUCCESS)
  })

  // The IPC server failed. Abort.
  ipc.of[IPC_SERVER_ID].on('error', () => {
    terminate(EXIT_CODES.SUCCESS)
  })

  // The IPC server was disconnected. Abort.
  ipc.of[IPC_SERVER_ID].on('disconnect', () => {
    terminate(EXIT_CODES.SUCCESS)
  })

  let writer = null

  ipc.of[IPC_SERVER_ID].on('write', (options) => {
    /**
     * @summary Progress handler
     * @param {Object} state - progress state
     * @example
     * writer.on('progress', onProgress)
     */
    const onProgress = (state) => {
      ipc.of[IPC_SERVER_ID].emit('state', state)
    }

    let exitCode = EXIT_CODES.SUCCESS

    /**
     * @summary Finish handler
     * @param {Object} results - Flash results
     * @example
     * writer.on('finish', onFinish)
     */
    const onFinish = (results) => {
      log(`Finish: ${results.bytesWritten}`)
      results.errors = _.map(results.errors, (error) => {
        return errors.toJSON(error)
      })
      ipc.of[IPC_SERVER_ID].emit('done', { results })
      terminate(exitCode)
    }

    /**
     * @summary Abort handler
     * @example
     * writer.on('abort', onAbort)
     */
    const onAbort = () => {
      log('Abort')
      ipc.of[IPC_SERVER_ID].emit('abort')
      terminate(exitCode)
    }

    ipc.of[IPC_SERVER_ID].on('cancel', onAbort)

    /**
     * @summary Error handler
     * @param {Error} error - error
     * @example
     * writer.on('error', onError)
     */
    const onError = (error) => {
      log(`Error: ${error.message}`)
      exitCode = EXIT_CODES.GENERAL_ERROR
      ipc.of[IPC_SERVER_ID].emit('error', errors.toJSON(error))
    }

    /**
     * @summary Failure handler (non-fatal errors)
     * @param {Object} error - MultiDestinationError
     * @example
     * writer.on('fail', onFail)
     */
    const onFail = (destination, error) => {
      ipc.of[IPC_SERVER_ID].emit('fail', {
        device: destination.drive,  // TODO: device should be destination
        error: errors.toJSON(error)
      })
    }

    const destinations = _.map(options.destinations, 'device')
    const dests = options.destinations.map((destination) => {
      return new sdk.sourceDestination.BlockDevice(destination, options.unmountOnSuccess)
    })
    const source = new sdk.sourceDestination.File(options.imagePath, sdk.sourceDestination.File.OpenFlags.Read)
    writeAndValidate(
      source,
      dests,
      options.validateWriteOnSuccess,
      onProgress,
      onFail,
      onFinish,
      onError
    )

    log(`Image: ${options.imagePath}`)
    log(`Devices: ${destinations.join(', ')}`)
    log(`Umount on success: ${options.unmountOnSuccess}`)
    log(`Validate on success: ${options.validateWriteOnSuccess}`)
  })

  ipc.of[IPC_SERVER_ID].on('connect', () => {
    log(`Successfully connected to IPC server: ${IPC_SERVER_ID}, socket root ${ipc.config.socketRoot}`)
    ipc.of[IPC_SERVER_ID].emit('ready', {})
  })
})
