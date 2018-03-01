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
 * @summary ImageWriter class
 * @class
 */
class ImageWriter extends EventEmitter {
  /**
   * @summary ImageWriter constructor
   * @param {Object} options - options
   * @param {String} options.imagePath - disk image path
   * @param {String} options.path - dest path
   * @param {Boolean} options.verify - whether to verify the dest
   * @param {Boolean} options.unmountOnSuccess - whether to unmount the dest after flashing
   * @param {Array<String>} options.checksumAlgorithms - checksums to calculate
   * @example
   * new ImageWriter(options)
   */
  constructor (options) {
    super()

    this.options = options

    this.source = null
    this.pipeline = null
    this.target = null

    this.bytesRead = 0
    this.bytesWritten = 0
    this.checksum = {}
  }

  /**
   * @summary Verify that the selected destination device exists
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.checkSelectedDevice((error) => {
   *   // ...
   * })
   */
  checkSelectedDevice (callback) {
    debug('state:device-select', this.options.path)
    this.destinationDevice = null
    drivelist.list((error, drives) => {
      debug('state:device-select', this.options.path, error ? 'NOT OK' : 'OK')

      if (error) {
        callback.call(this, error)
        return
      }

      const selectedDrive = _.find(drives, {
        device: this.options.path
      })

      if (!selectedDrive) {
        const selectionError = errors.createUserError({
          title: 'The selected drive was not found',
          description: `We can't find ${this.options.path} in your system. Did you unplug the drive?`,
          code: 'EUNPLUGGED'
        })
        debug('state:device-select', this.options.path, 'NOT OK')
        callback.call(this, selectionError)
        return
      }

      this.destinationDevice = selectedDrive

      callback.call(this)
    })
  }

  /**
   * @summary Unmount the destination device
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.unmountDevice((error) => {
   *   // ...
   * })
   */
  unmountDevice (callback) {
    if (os.platform() === 'win32') {
      callback.call(this)
      return
    }

    debug('state:unmount', this.destinationDevice.device)

    mountutils.unmountDisk(this.destinationDevice.device, (error) => {
      debug('state:unmount', this.destinationDevice.device, error ? 'NOT OK' : 'OK')
      callback.call(this, error)
    })
  }

  /**
   * @summary Clean a device's partition table
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.removePartitionTable((error) => {
   *   // ...
   * })
   */
  removePartitionTable (callback) {
    if (os.platform() !== 'win32') {
      callback.call(this)
      return
    }

    debug('state:clean', this.destinationDevice.device)

    diskpart.clean(this.destinationDevice.device).asCallback((error) => {
      debug('state:clean', this.destinationDevice.device, error ? 'NOT OK' : 'OK')
      callback.call(this, error)
    })
  }

  /**
   * @summary Open the source for reading
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.openSource((error) => {
   *   // ...
   * })
   */
  openSource (callback) {
    debug('state:source-open', this.options.imagePath)
    imageStream.getFromFilePath(this.options.imagePath).asCallback((error, image) => {
      debug('state:source-open', this.options.imagePath, error ? 'NOT OK' : 'OK')
      if (error) {
        callback.call(this, error)
        return
      }

      if (!constraints.isDriveLargeEnough(this.destinationDevice, image)) {
        const driveError = errors.createUserError({
          title: 'The image you selected is too big for this drive',
          description: 'Please connect a bigger drive and try again'
        })
        debug('state:source-open', this.options.imagePath, 'NOT OK')
        callback.call(this, driveError)
        return
      }

      this.options.image = image

      callback.call(this)
    })
  }

  /**
   * @summary Open the destination for writing
   * @param {Function} callback - callback(error)
   * @private
   * @example
   * writer.openDestination((error) => {
   *   // ...
   * })
   */
  openDestination (callback) {
    debug('state:destination-open', this.destinationDevice.raw)

    /* eslint-disable no-bitwise */
    const flags = fs.constants.O_RDWR |
      fs.constants.O_NONBLOCK |
      fs.constants.O_SYNC
    /* eslint-enable no-bitwise */

    fs.open(this.destinationDevice.raw, flags, (error, fd) => {
      debug('state:destination-open', this.destinationDevice.raw, error ? 'NOT OK' : 'OK')
      this.options.fd = fd
      callback.call(this, error)
    })
  }

  /**
   * @summary Start the flashing process
   * @returns {ImageWriter} imageWriter
   * @example
   * imageWriter.flash()
   *   .on('error', reject)
   *   .on('progress', onProgress)
   *   .on('finish', resolve)
   */
  flash () {
    const tasks = [
      (next) => { this.checkSelectedDevice(next) },
      (next) => { this.unmountDevice(next) },
      (next) => { this.removePartitionTable(next) },
      (next) => { this.openSource(next) },
      (next) => { this.openDestination(next) }
    ]

    runSeries(tasks, (error) => {
      if (error) {
        this.emit('error', error)
        return
      }

      this.write()
    })

    return this
  }

  /**
   * @summary Start the writing process
   * @returns {ImageWriter} imageWriter
   * @example
   * imageWriter.write()
   */
  write () {
    this._createWritePipeline(this.options)
      .on('checksum', (checksum) => {
        debug('write:checksum', checksum)
        this.checksum = checksum
      })
      .on('error', (error) => {
        this.emit('error', error)
      })

    this.target.on('finish', () => {
      this.bytesRead = this.source.bytesRead
      this.bytesWritten = this.target.bytesWritten
      if (this.options.verify) {
        this.verify()
      } else {
        this._finish()
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
    this._createVerifyPipeline(this.options)
      .on('error', (error) => {
        this.emit('error', error)
      })
      .on('checksum', (checksum) => {
        debug('verify:checksum', this.checksum, '==', checksum)
        if (!_.isEqual(this.checksum, checksum)) {
          const error = new Error(`Verification failed: ${JSON.stringify(this.checksum)} != ${JSON.stringify(checksum)}`)
          error.code = 'EVALIDATION'
          this.emit('error', error)
        }
        this._finish()
      })
      .on('finish', () => {
        debug('verify:end')

        // NOTE: As the 'checksum' event only happens after
        // the 'finish' event, we `._finish()` there instead of here
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
    fs.close(this.options.fd, (closeError) => {
      debug('state:cleanup', closeError ? 'NOT OK' : 'OK')
      if (!this.options.unmountOnSuccess) {
        callback.call(this, closeError)
        return
      }

      // Closing a file descriptor on a drive containing mountable
      // partitions causes macOS to mount the drive. If we try to
      // unmount too quickly, then the drive might get re-mounted
      // right afterwards.
      setTimeout(() => {
        mountutils.unmountDisk(this.destinationDevice.device, (error) => {
          debug('state:cleanup', error ? 'NOT OK' : 'OK')
          callback.call(this, error)
        })
      }, UNMOUNT_ON_SUCCESS_TIMEOUT_MS)
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
      this.emit('finish', {
        drive: this.destinationDevice,
        bytesRead: this.bytesRead,
        bytesWritten: this.bytesWritten,
        checksum: this.checksum
      })
    })
  }

  /**
   * @summary Creates a write pipeline from given options
   * @private
   * @param {Object} options - options
   * @param {Object} options.image - source image
   * @param {Number} [options.fd] - destination file descriptor
   * @param {String} [options.path] - destination file path
   * @param {String} [options.flags] - destination file open flags
   * @param {String} [options.mode] - destination file mode
   * @returns {Pipage} pipeline
   * @example
   * this._createWritePipeline({
   *   image: sourceImage,
   *   path: '/dev/rdisk2'
   * })
   */
  _createWritePipeline (options) {
    const pipeline = new Pipage({
      readableObjectMode: true
    })

    const image = options.image
    const source = image.stream
    const progressOptions = {
      length: image.size.original,
      time: 500
    }

    let progressStream = null

    // If the final size is an estimation,
    // use the original source size for progress metering
    if (image.size.final.estimation) {
      progressStream = new ProgressStream(progressOptions)
      pipeline.append(progressStream)
    }

    const isPassThrough = image.transform instanceof stream.PassThrough

    // If the image transform is a pass-through,
    // ignore it to save on the overhead
    if (image.transform && !isPassThrough) {
      pipeline.append(image.transform)
    }

    // If the final size is known precisely and we're not
    // using block maps, then use the final size for progress
    if (!image.size.final.estimation && !image.bmap) {
      progressOptions.length = image.size.final.value
      progressStream = new ProgressStream(progressOptions)
      pipeline.append(progressStream)
    }

    if (image.bmap) {
      const blockMap = BlockMap.parse(image.bmap)
      debug('write:bmap', blockMap)
      progressStream = new ProgressStream(progressOptions)
      pipeline.append(progressStream)
      pipeline.append(new BlockMap.FilterStream(blockMap))
    } else {
      debug('write:blockstream')
      const checksumStream = new ChecksumStream({
        objectMode: true,
        algorithms: options.checksumAlgorithms
      })
      pipeline.append(new BlockStream())
      pipeline.append(checksumStream)
      pipeline.bind(checksumStream, 'checksum')
    }

    const target = new BlockWriteStream({
      fd: options.fd,
      autoClose: false
    })

    // Pipeline.bind(progressStream, 'progress');
    progressStream.on('progress', (state) => {
      state.device = options.path
      state.type = 'write'
      state.speed = target.speed
      this.emit('progress', state)
    })

    pipeline.bind(source, 'error')
    pipeline.bind(target, 'error')

    source.pipe(pipeline)
      .pipe(target)

    this.source = source
    this.pipeline = pipeline
    this.target = target

    return pipeline
  }

  /**
   * @summary Creates a verification pipeline from given options
   * @private
   * @param {Object} options - options
   * @param {Object} options.image - image
   * @param {Number} [options.fd] - file descriptor
   * @param {String} [options.path] - file path
   * @param {String} [options.flags] - file open flags
   * @param {String} [options.mode] - file mode
   * @returns {Pipage} pipeline
   * @example
   * this._createVerifyPipeline({
   *   path: '/dev/rdisk2'
   * })
   */
  _createVerifyPipeline (options) {
    const pipeline = new Pipage()

    let size = this.bytesWritten

    if (!options.image.size.final.estimation) {
      size = Math.max(this.bytesWritten, options.image.size.final.value)
    }

    const progressStream = new ProgressStream({
      length: size,
      time: 500
    })

    pipeline.append(progressStream)

    if (options.image.bmap) {
      debug('verify:bmap')
      const blockMap = BlockMap.parse(options.image.bmap)
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
        algorithms: options.checksumAlgorithms
      })
      pipeline.append(checksumStream)
      pipeline.bind(checksumStream, 'checksum')
    }

    const source = new BlockReadStream({
      fd: options.fd,
      autoClose: false,
      start: 0,
      end: size
    })

    pipeline.bind(source, 'error')

    progressStream.on('progress', (state) => {
      state.device = options.path
      state.type = 'check'
      this.emit('progress', state)
    })

    this.target = null
    this.source = source
    this.pipeline = pipeline

    source.pipe(pipeline).resume()

    return pipeline
  }
}

module.exports = ImageWriter
