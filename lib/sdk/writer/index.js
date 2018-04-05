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
const fs = require('fs')
const EventEmitter = require('events').EventEmitter
const mountutils = require('mountutils')
const drivelist = require('drivelist')
const stream = require('readable-stream')
const Pipage = require('pipage')
const BlockMap = require('blockmap')
const BlockStream = require('./block-stream')
const BlockWriteStream = require('./block-write-stream')
const BlockReadStream = require('./block-read-stream')
const ChecksumStream = require('./checksum-stream')
const ProgressStream = require('./progress-stream')
const imageStream = require('../image-stream')
const diskpart = require('../../cli/diskpart')
const constraints = require('../../shared/drive-constraints')
const errors = require('../../shared/errors')
const debug = require('debug')('etcher:writer')
const _ = require('lodash')

/* eslint-disable prefer-reflect */
/* eslint-disable callback-return */

/**
 * @summary Timeout, in milliseconds, to wait before unmounting on success
 * @constant
 * @type {Number}
 */
const UNMOUNT_ON_SUCCESS_TIMEOUT_MS = 2000

/**
 * @summary Helper function to run a set of async tasks in sequence
 * @private
 * @param {Array<Function>} tasks - set of tasks
 * @param {Function} callback - callback(error)
 * @example
 * runSeries([
 *   (next) => first(next),
 *   (next) => second(next),
 * ], (error) => {
 *   // ...
 * })
 */
const runSeries = (tasks, callback) => {
  /**
   * @summary Task runner
   * @param {Error} [error] - error
   * @example
   * run()
   */
  const run = (error) => {
    const task = tasks.shift()
    if (error || task == null) {
      callback(error)
      return
    }
    task(run)
  }

  run()
}

/**
 * @summary Helper function to run a set of async tasks in sequence
 * @private
 * @param {Array<Function>} tasks - set of tasks
 * @param {Function} callback - callback(error)
 * @example
 * runParallel([
 *   (next) => first(next),
 *   (next) => second(next),
 * ], (error) => {
 *   // ...
 * })
 */
const runParallel = (tasks, callback) => {
  let count = tasks.length
  const resultErrors = new Array(count).fill(null)
  const results = new Array(count).fill(null)

  tasks.forEach((task, index) => {
    task((error, result) => {
      count -= 1
      resultErrors[index] = error
      results[index] = result
      if (count === 0) {
        callback(resultErrors, results)
      }
    })
  })
}

/**
 * @summary ImageWriter class
 * @class
 */
class ImageWriter extends EventEmitter {
  /**
   * @summary ImageWriter constructor
   * @param {Object} options - options
   * @param {Boolean} options.verify - whether to verify the dest
   * @param {Boolean} options.unmountOnSuccess - whether to unmount the dest after flashing
   * @param {Array<String>} options.checksumAlgorithms - checksums to calculate
   * @example
   * new ImageWriter(options)
   */
  constructor (options) {
    options = options || {}
    super()

    debug('new', options)

    this.unmountOnSuccess = Boolean(options.unmountOnSuccess)
    this.verifyChecksums = Boolean(options.verify)
    this.checksumAlgorithms = options.checksumAlgorithms || []

    this.source = null
    this.pipeline = null
    this.destinations = new Map()

    this.finished = false
    this.hadError = false

    this.bytesRead = 0
    this.bytesWritten = 0
    this.checksum = {}

    this.once('error', () => {
      this.hadError = true
    })
  }

  /**
   * @summary Verify that the selected destination devices exist
   * @param {Array<String>} paths - target device paths
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.getSelectedDevices(['/dev/disk2'], (error, destinations) => {
   *   // ...
   * })
   */
  getSelectedDevices (paths, callback) {
    debug('state:device-select', paths)
    drivelist.list((error, drives) => {
      debug('state:device-select', paths, error ? 'NOT OK' : 'OK')

      if (error) {
        callback.call(this, error)
        return
      }

      const results = paths.map((path) => {
        const destination = {
          fd: null,
          error: null,
          stream: null,
          finished: false,
          verified: false,
          device: _.find(drives, {
            device: path
          })
        }

        if (!destination.device) {
          const selectionError = errors.createUserError({
            title: `The selected drive "${path}" was not found`,
            description: `We can't find "${path}" in your system. Did you unplug the drive?`,
            code: 'EUNPLUGGED'
          })
          debug('state:device-select', destination, 'NOT OK')
          destination.error = selectionError
        }

        return destination
      })

      callback.call(this, null, results)
    })
  }

  /**
   * @summary Unmount the destination device
   * @param {Object} destination - destination object
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.unmountDevice((error) => {
   *   // ...
   * })
   */
  unmountDevice (destination, callback) {
    if (os.platform() === 'win32') {
      callback.call(this)
      return
    }

    debug('state:unmount', destination.device.device)

    mountutils.unmountDisk(destination.device.device, (error) => {
      debug('state:unmount', destination.device.device, error ? 'NOT OK' : 'OK')
      callback.call(this, error)
    })
  }

  /**
   * @summary Clean a device's partition table
   * @param {Object} destination - destination object
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.removePartitionTable((error) => {
   *   // ...
   * })
   */
  removePartitionTable (destination, callback) {
    if (os.platform() !== 'win32') {
      callback.call(this)
      return
    }

    debug('state:clean', destination.device.device)

    diskpart.clean(destination.device.device).asCallback((error) => {
      debug('state:clean', destination.device.device, error ? 'NOT OK' : 'OK')
      callback.call(this, error)
    })
  }

  /**
   * @summary Open the source for reading
   * @param {String} imagePath - path to source image
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.openSource('path/to/image.img', (error, source) => {
   *   // ...
   * })
   */
  openSource (imagePath, callback) {
    debug('state:source-open', imagePath)
    imageStream.getFromFilePath(imagePath).asCallback((error, image) => {
      debug('state:source-open', imagePath, error ? 'NOT OK' : 'OK')
      this.source = image
      callback.call(this, error, this.source)
    })
  }

  /**
   * @summary Open the destination for writing
   * @param {Object} destination - destination object
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.openDestination((error) => {
   *   // ...
   * })
   */
  openDestination (destination, callback) {
    debug('state:destination-open', destination.device.raw)

    /* eslint-disable no-bitwise */
    const flags = fs.constants.O_RDWR |
      fs.constants.O_NONBLOCK |
      fs.constants.O_SYNC
    /* eslint-enable no-bitwise */

    fs.open(destination.device.raw, flags, (error, fd) => {
      debug('state:destination-open', destination.device.raw, error ? 'NOT OK' : 'OK')
      destination.fd = fd
      callback.call(this, error)
    })
  }

  /**
   * @summary Check a destinstation against the drive constraints
   * @param {Object} destination - destination object
   * @param {Function} callback - callback(error)
   * @example
   * this.checkDriveConstraints(destination, (error) => {
   *   // ...
   * })
   */
  checkDriveConstraints (destination, callback) {
    let error = null

    if (!constraints.isDriveLargeEnough(destination.device, this.source)) {
      error = errors.createUserError({
        title: 'The image you selected is too big for this drive',
        description: 'Please connect a bigger drive and try again'
      })
    }

    callback.call(this, error)
  }

  /**
   * @summary Start the flashing process
   * @param {String} imagePath - path to source image
   * @param {Array<String>} destinationPaths - paths to target devices
   * @returns {ImageWriter} imageWriter
   * @example
   * imageWriter.write(source, destinations)
   *   .on('error', reject)
   *   .on('progress', onProgress)
   *   .on('finish', resolve)
   */
  write (imagePath, destinationPaths) {
    // Open the source image
    this.openSource(imagePath, (openError, source) => {
      if (openError) {
        this.emit('error', openError)
        return
      }

      // Open & prepare target devices
      this.getSelectedDevices(destinationPaths, (error, destinations) => {
        if (error) {
          this.emit('error', error)
          return
        }

        const notFound = _.find(destinations, (destination) => {
          return Boolean(destination.error)
        })

        if (notFound) {
          this.emit('error', notFound.error)
          return
        }

        // Generate preparation tasks for all destinations
        const tasks = destinations.map((destination) => {
          this.destinations.set(destination.device.device, destination)
          return (next) => {
            runSeries([
              (done) => { this.checkDriveConstraints(destination, done) },
              (done) => { this.unmountDevice(destination, done) },
              (done) => { this.removePartitionTable(destination, done) },
              (done) => { this.openDestination(destination, done) }
            ], (preparationError) => {
              destination.error = preparationError
              next(preparationError)
            })
          }
        })

        // Run the preparation tasks in parallel for each destination
        runParallel(tasks, (resultErrors, results) => {
          // We can start (theoretically) flashing now...
          debug('write:prep:done', resultErrors)
          this._write()
        })
      })
    })

    return this
  }

  /**
   * @summary Internal progress state handler
   * @param {Object} state - progress state
   * @example
   * pipeline.on('progress', (state) => {
   *   // ...
   *   this._onProgress(state)
   * })
   */
  _onProgress (state) {
    state.totalSpeed = 0
    state.active = 0

    state.flashing = 0
    state.verifying = 0
    state.failed = 0
    state.succeeded = 0

    this.destinations.forEach((dest) => {
      state.flashing += !dest.error && !dest.finished ? 1 : 0
      state.verifying += !dest.error && dest.finished && !dest.verified ? 1 : 0
      state.failed += dest.error ? 1 : 0
      state.succeeded += !dest.error && dest.finished && (dest.verified || !this.verifyChecksums) ? 1 : 0
      if (!(dest.finished && dest.verified) && !dest.error) {
        state.totalSpeed += state.type === 'write'
          ? (dest.stream.speed || 0)
          : (dest.progress.state.speed || 0)
        state.active += 1
      }
    })

    state.speed = state.active
      ? state.totalSpeed / state.active
      : state.totalSpeed

    state.eta = state.speed ? state.remaining / state.speed : 0

    this.emit('progress', state)
  }

  /**
   * @summary Start the writing process
   * @returns {ImageWriter} imageWriter
   * @example
   * imageWriter.write()
   */
  _write () {
    this.pipeline = this._createWritePipeline()

    this.pipeline.on('checksum', (checksum) => {
      debug('write:checksum', checksum)
      this.checksum = checksum
    })

    this.pipeline.on('error', (error) => {
      this.emit('error', error)
    })

    this.pipeline.on('finish', (destination) => {
      this.bytesRead = this.source.bytesRead

      let finishedCount = 0

      this.destinations.forEach((dest) => {
        finishedCount += dest.finished ? 1 : 0
      })

      debug('write:finish', finishedCount, '/', this.destinations.size)

      if (destination) {
        this.bytesWritten += destination.stream.bytesWritten
      }

      if (finishedCount === this.destinations.size) {
        if (this.verifyChecksums) {
          debug('write:verify')
          this.verify()
        } else {
          debug('write:finish')
          this._finish()
        }
      }
    })

    return this
  }

  /**
   * @summary Start the writing process
   * @returns {ImageWriter} imageWriter
   * @example
   * imageWriter.verify()
   */
  verify () {
    const progressStream = new ProgressStream({
      length: this.bytesWritten,
      time: 500
    })

    progressStream.resume()

    progressStream.on('progress', (state) => {
      state.type = 'check'
      this._onProgress(state)
    })

    this.destinations.forEach((destination) => {
      // Don't verify errored destinations
      if (destination.error || !destination.stream) {
        return
      }

      const pipeline = this._createVerifyPipeline(destination)

      pipeline.on('error', (error) => {
        this.emit('error', error)
      })

      pipeline.on('checksum', (checksum) => {
        debug('verify:checksum', this.checksum, '==', checksum)
        destination.checksum = checksum
        if (!_.isEqual(this.checksum, checksum)) {
          const error = new Error(`Verification failed: ${JSON.stringify(this.checksum)} != ${JSON.stringify(checksum)}`)
          error.code = 'EVALIDATION'
          destination.error = error
          this.emit('error', error)
        }
      })

      pipeline.on('finish', () => {
        debug('verify:finish')

        destination.verified = true
        destination.progress = null
        destination.stream = null

        let finishedCount = 0

        this.destinations.forEach((dest) => {
          finishedCount += (dest.error || dest.verified) ? 1 : 0
        })

        if (finishedCount === this.destinations.size) {
          debug('verify:complete')
          progressStream.end()
          this._finish()
        }
      })

      // NOTE: Normally we'd use `pipeline.pipe(progressStream)` here,
      // but that leads to degraded performance
      pipeline.on('readable', function () {
        let chunk = null
        while ((chunk = this.read())) {
          progressStream.write(chunk)
        }
      })
    })

    return this
  }

  /**
   * @summary Abort the flashing process
   * @example
   * imageWriter.abort()
   */
  abort () {
    if (this.source) {
      this.source.destroy()
    }
    this.emit('abort')
  }

  /**
   * @summary Cleanup after writing; close file descriptors & unmount
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer._cleanup((error) => {
   *   // ...
   * })
   */
  _cleanup (callback) {
    debug('state:cleanup')
    const tasks = []

    this.destinations.forEach((destination) => {
      tasks.push((next) => {
        runSeries([
          (done) => {
            if (destination.fd) {
              fs.close(destination.fd, done)
              destination.fd = null
            } else {
              done()
            }
          },
          (done) => {
            if (!this.unmountOnSuccess) {
              done()
              return
            }

            // Closing a file descriptor on a drive containing mountable
            // partitions causes macOS to mount the drive. If we try to
            // unmount too quickly, then the drive might get re-mounted
            // right afterwards.
            setTimeout(() => {
              mountutils.unmountDisk(destination.device.device, (error) => {
                debug('state:cleanup', error ? 'NOT OK' : 'OK')
                done(error)
              })
            }, UNMOUNT_ON_SUCCESS_TIMEOUT_MS)
          }
        ], next)
      })
    })

    runParallel(tasks, (resultErrors, results) => {
      debug('state:cleanup', resultErrors)
      callback.call(this, resultErrors)
    })
  }

  /**
   * @summary Emits the `finish` event with state metadata
   * @private
   * @example
   * this._finish()
   */
  _finish () {
    this._cleanup(() => {
      this.finished = true
      this.emit('finish', {
        bytesRead: this.bytesRead,
        bytesWritten: this.bytesWritten,
        checksum: this.checksum
      })
    })
  }

  /**
   * @summary Creates a write pipeline from given options
   * @private
   * @returns {Pipage} pipeline
   * @example
   * this._createWritePipeline()
   */
  _createWritePipeline () {
    const pipeline = new Pipage({
      readableObjectMode: true
    })

    const progressOptions = {
      length: this.source.size.original,
      time: 500
    }

    let progressStream = null

    // If the final size is an estimation,
    // use the original source size for progress metering
    if (this.source.size.final.estimation) {
      progressStream = new ProgressStream(progressOptions)
      pipeline.append(progressStream)
    }

    const isPassThrough = this.source.transform instanceof stream.PassThrough

    // If the image transform is a pass-through,
    // ignore it to save on the overhead
    if (this.source.transform && !isPassThrough) {
      pipeline.append(this.source.transform)
    }

    // If the final size is known precisely and we're not
    // using block maps, then use the final size for progress
    if (!this.source.size.final.estimation && !this.source.bmap) {
      progressOptions.length = this.source.size.final.value
      progressStream = new ProgressStream(progressOptions)
      pipeline.append(progressStream)
    }

    if (this.source.bmap) {
      const blockMap = BlockMap.parse(this.source.bmap)
      debug('write:bmap', blockMap)
      progressStream = new ProgressStream(progressOptions)
      pipeline.append(progressStream)
      pipeline.append(new BlockMap.FilterStream(blockMap))
    } else {
      debug('write:blockstream')
      pipeline.append(new BlockStream())
      if (this.verifyChecksums) {
        const checksumStream = new ChecksumStream({
          objectMode: true,
          algorithms: this.checksumAlgorithms
        })
        pipeline.append(checksumStream)
        pipeline.bind(checksumStream, 'checksum')
      }
    }

    this.destinations.forEach((destination) => {
      if (destination.error) {
        debug('pipeline:skip', destination.device.device)
        return
      }

      destination.stream = new BlockWriteStream({
        fd: destination.fd,
        autoClose: false
      })

      destination.stream.once('finish', () => {
        debug('finish:unpipe', destination.device.device)
        destination.finished = true
        pipeline.emit('finish', destination)
        pipeline.unpipe(destination.stream)
      })

      destination.stream.once('error', (error) => {
        debug('error:unpipe', destination.device.device)
        destination.error = error
        destination.finished = true
        pipeline.unpipe(destination.stream)
      })

      pipeline.bind(destination.stream, 'error')
      pipeline.pipe(destination.stream)
    })

    // Pipeline.bind(progressStream, 'progress');
    progressStream.on('progress', (state) => {
      state.type = 'write'
      this._onProgress(state)
    })

    pipeline.bind(this.source.stream, 'error')
    this.source.stream.pipe(pipeline)

    return pipeline
  }

  /**
   * @summary Creates a verification pipeline from given options
   * @private
   * @param {Object} destination - the destination object
   * @returns {Pipage} pipeline
   * @example
   * this._createVerifyPipeline()
   */
  _createVerifyPipeline (destination) {
    const pipeline = new Pipage()

    let size = destination.stream.bytesWritten

    if (!this.source.size.final.estimation) {
      size = Math.max(size, this.source.size.final.value)
    }

    const progressStream = new ProgressStream({
      length: size,
      time: 500
    })

    pipeline.append(progressStream)

    if (this.source.bmap) {
      debug('verify:bmap')
      const blockMap = BlockMap.parse(this.source.bmap)
      const blockMapStream = new BlockMap.FilterStream(blockMap)
      pipeline.append(blockMapStream)

      // NOTE: Because the blockMapStream checksums each range,
      // and doesn't emit a final "checksum" event, we artificially
      // raise one once the stream finishes
      blockMapStream.once('finish', () => {
        pipeline.emit('checksum', {})
      })
    } else {
      const checksumStream = new ChecksumStream({
        algorithms: this.checksumAlgorithms
      })
      pipeline.append(checksumStream)
      pipeline.bind(checksumStream, 'checksum')
    }

    const source = new BlockReadStream({
      fd: destination.fd,
      autoClose: false,
      start: 0,
      end: size
    })

    pipeline.bind(source, 'error')

    destination.stream = source.pipe(pipeline)
    destination.progress = progressStream

    return pipeline
  }
}

module.exports = ImageWriter
