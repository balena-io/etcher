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

const DISCONNECT_DELAY = 100
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
const handleError = async (error) => {
  ipc.of[IPC_SERVER_ID].emit('error', errors.toJSON(error))
  await Bluebird.delay(DISCONNECT_DELAY)
  terminate(EXIT_CODES.GENERAL_ERROR)
}

/**
 * @summary writes the source to the destinations and valiates the writes
 * @param {SourceDestination} source - source
 * @param {SourceDestination[]} destinations - destinations
 * @param {Boolean} verify - whether to validate the writes or not
 * @param {Boolean} trim - whether to trim ext partitions before writing
 * @param {Function} onProgress - function to call on progress
 * @param {Function} onFail - function to call on fail
 * @returns {Promise<{ bytesWritten, devices, errors} >}
 *
 * @example
 * writeAndValidate(source, destinations, verify, onProgress, onFail, onFinish, onError)
 */
const writeAndValidate = async (source, destinations, verify, trim, onProgress, onFail) => {
  let innerSource = await source.getInnerSource()
  if (trim && (await innerSource.canRead())) {
    innerSource = new sdk.sourceDestination.ConfiguredSource(
      innerSource,
      trim,

      // Create stream from file-disk (not source stream)
      true
    )
  }
  const { failures, bytesWritten } = await sdk.multiWrite.pipeSourceToDestinations(
    innerSource,
    destinations,
    onFail,
    onProgress,
    verify
  )
  const result = {
    bytesWritten,
    devices: {
      failed: failures.size,
      successful: destinations.length - failures.size
    },
    errors: []
  }
  for (const [ destination, error ] of failures) {
    error.device = destination.drive.device
    result.errors.push(error)
  }
  return result
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

  ipc.of[IPC_SERVER_ID].on('write', async (options) => {
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
     * @summary Abort handler
     * @example
     * writer.on('abort', onAbort)
     */
    const onAbort = async () => {
      log('Abort')
      ipc.of[IPC_SERVER_ID].emit('abort')
      await Bluebird.delay(DISCONNECT_DELAY)
      terminate(exitCode)
    }

    ipc.of[IPC_SERVER_ID].on('cancel', onAbort)

    /**
     * @summary Failure handler (non-fatal errors)
     * @param {SourceDestination} destination - destination
     * @param {Error} error - error
     * @example
     * writer.on('fail', onFail)
     */
    const onFail = (destination, error) => {
      ipc.of[IPC_SERVER_ID].emit('fail', {
        // TODO: device should be destination
        device: destination.drive,
        error: errors.toJSON(error)
      })
    }

    const destinations = _.map(options.destinations, 'device')
    log(`Image: ${options.imagePath}`)
    log(`Devices: ${destinations.join(', ')}`)
    log(`Umount on success: ${options.unmountOnSuccess}`)
    log(`Validate on success: ${options.validateWriteOnSuccess}`)
    log(`Trim: ${options.trim}`)
    const dests = _.map(options.destinations, (destination) => {
      return new sdk.sourceDestination.BlockDevice(destination, options.unmountOnSuccess)
    })
    const source = new sdk.sourceDestination.File(options.imagePath, sdk.sourceDestination.File.OpenFlags.Read)
    try {
      const results = await writeAndValidate(
        source,
        dests,
        options.validateWriteOnSuccess,
        options.trim,
        onProgress,
        onFail
      )
      log(`Finish: ${results.bytesWritten}`)
      results.errors = _.map(results.errors, (error) => {
        return errors.toJSON(error)
      })
      ipc.of[IPC_SERVER_ID].emit('done', { results })
      await Bluebird.delay(DISCONNECT_DELAY)
      terminate(exitCode)
    } catch (error) {
      log(`Error: ${error.message}`)
      exitCode = EXIT_CODES.GENERAL_ERROR
      ipc.of[IPC_SERVER_ID].emit('error', errors.toJSON(error))
    }
  })

  ipc.of[IPC_SERVER_ID].on('connect', () => {
    log(`Successfully connected to IPC server: ${IPC_SERVER_ID}, socket root ${ipc.config.socketRoot}`)
    ipc.of[IPC_SERVER_ID].emit('ready', {})
  })
})
