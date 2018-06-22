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
const ImageWriter = require('../../sdk/writer')
const BlockWriteStream = require('../../sdk/writer/block-write-stream')
const BlockReadStream = require('../../sdk/writer/block-read-stream')

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

function runVerifier(verifier, onFail) {
  return new Promise((resolve, reject) => {
    verifier.on('error', onFail);
    verifier.on('finish', resolve);
    verifier.run();
  });
}

function pipeRegularSourceToDestination(source, destination, verify, onProgress, onFail) {
  let checksum
  let sourceMetadata
  let step = 'flashing'
  let lastPosition = 0
  const errors = new Map()  // destination -> error map
  const state = {
    active: destination.destinations.length,
    flashing: destination.destinations.length,
    verifying: 0,
    failed: 0,
    successful: 0,
    type: step
  }
  function updateState() {
    state.type = step
    state.failed = errors.size
    state.active = destination.destinations.length - state.failed
    if (step === 'flashing') {
      state.flashing = state.active
      state.verifying = 0
    } else if (step === 'check') {
      state.flashing = 0
      state.verifying = state.active
    } else if (step === 'finished') {
      state.successful = state.active
    }
  }
  function onProgress2(progressEvent) {
    lastPosition = progressEvent.position
    progressEvent.percentage = progressEvent.position / sourceMetadata.size * 100
    // NOTE: We need to guard against this becoming Infinity,
    // because that value isn't transmitted properly over IPC and becomes `null`
    progressEvent.eta = progressEvent.speed ? (sourceMetadata.size - progressEvent.position) / progressEvent.speed : null
    progressEvent.totalSpeed = progressEvent.speed * state.active
    Object.assign(progressEvent, state)
    onProgress(progressEvent)
  }
  return Promise.all([ source.createReadStream(), destination.createWriteStream(), source.getMetadata() ])
  .then(([ sourceStream, destinationStream, metadata ]) => {
    destinationStream.on('fail', (error) => {
      errors.set(error.destination, error.error)
      updateState()
      onFail({ device: error.destination.drive, error: error.error })  // TODO: device should be error.destination
      onProgress2({ eta: 0, speed: 0, position: lastPosition })  // TODO: this is not needed if a success / error screen is shown
    })
    sourceMetadata = metadata
    return new Promise((resolve, reject) => {
      let done = false
      sourceStream.on('error', reject)
      destinationStream.on('progress', onProgress2)
      if (verify) {
        const hasher = sdk.sourceDestination.createHasher()
        hasher.on('checksum', (cs) => {
          checksum = cs
          if (done) {
            resolve()
          }
        })
        sourceStream.pipe(hasher)
      }
      destinationStream.on('done', () => {
        done = true;
        if (!verify || (checksum !== undefined)) {
          resolve()
        }
      })
      sourceStream.pipe(destinationStream)
    })
  })
  .then(() => {
    if (sourceMetadata.size == null) {
      // This is needed for compressed sources for which we don't know the uncompressed size:
      // After writing the image, we know the size.
      sourceMetadata.size = lastPosition
    }
    if (verify) {
      step = 'check'
      updateState()
      const verifier = destination.createVerifier(checksum, sourceMetadata.size)
      verifier.on('progress', onProgress2)
      return runVerifier(verifier, onFail)
    }
  })
  .then(() => {
    step = 'finished'
    updateState()
    onProgress2({ speed: 0, position: sourceMetadata.size })
  })
  .then(() => {
    const result = {
      bytesWritten: lastPosition,
      devices: {
        failed: state.failed,
        successful: state.active
      },
      errors: []
    }
    if (verify && (checksum !== undefined)) {
      result.checksum = { xxhash: checksum }
    }
    for (const [ destination, error ] of errors) {
      error.device = destination.drive.device
      result.errors.push(error)
    }
    return result
  })
}

function sourceDestinationDisposer(sourceDestination) {
  return Bluebird.resolve(sourceDestination.open())
  .return(sourceDestination)
  .disposer(() => {
    return Bluebird.resolve(sourceDestination.close()).catchReturn()
  })
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
     * @param {Object} event - event data (error & device)
     * @example
     * writer.on('fail', onFail)
     */
    const onFail = (event) => {
      ipc.of[IPC_SERVER_ID].emit('fail', {
        device: event.device,
        error: errors.toJSON(event.error)
      })
    }

    writer = new ImageWriter({ // TODO: remove
      verify: options.validateWriteOnSuccess,
      unmountOnSuccess: options.unmountOnSuccess,
      checksumAlgorithms: options.checksumAlgorithms || []
    })

    writer.on('abort', onAbort)

    const destinations = _.map(options.destinations, 'drive.device')
    const dests = options.destinations.map((destination) => {
      return new sdk.sourceDestination.BlockDevice(destination)
    })
    Bluebird.using(
      sourceDestinationDisposer(new sdk.sourceDestination.File(options.imagePath, sdk.sourceDestination.File.OpenFlags.Read)),
      sourceDestinationDisposer(new sdk.sourceDestination.MultiDestination(dests)),
      (source, destination) => {
        return source.getInnerSource()
        .then((innerSource) => {
          return Bluebird.using(sourceDestinationDisposer(innerSource), (innerSource) => {
            return pipeRegularSourceToDestination(innerSource, destination, options.validateWriteOnSuccess, onProgress, onFail)
          })
        })
      }
    )
    .then((results) => {
      onFinish(results)
    })
    .catch((error) => {
      onError(error)
    })

    log(`Image: ${options.imagePath}`)
    log(`Devices: ${destinations.join(', ')}`)
    log(`Umount on success: ${options.unmountOnSuccess}`)
    log(`Validate on success: ${options.validateWriteOnSuccess}`)
  })

  ipc.of[IPC_SERVER_ID].on('cancel', () => {
    if (writer) {
      writer.abort()
    }
  })

  ipc.of[IPC_SERVER_ID].on('connect', () => {
    log(`Successfully connected to IPC server: ${IPC_SERVER_ID}, socket root ${ipc.config.socketRoot}`)
    ipc.of[IPC_SERVER_ID].emit('ready', {})
  })
})
