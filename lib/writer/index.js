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

const stream = require('readable-stream')
const Pipage = require('pipage')
const BlockMap = require('blockmap')
const BlockStream = require('./block-stream')
const BlockWriteStream = require('./block-write-stream')
const BlockReadStream = require('./block-read-stream')
const ChecksumStream = require('./checksum-stream')
const ProgressStream = require('./progress-stream')
const debug = require('debug')('image-writer')
const EventEmitter = require('events').EventEmitter
const _ = require('lodash')

/**
 * @summary ImageWriter class
 * @class
 */
class ImageWriter extends EventEmitter {
  /**
   * @summary ImageWriter constructor
   * @param {Object} options - options
   * @example
   * new ImageWriter(options)
   */
  constructor (options) {
    super()

    this.options = options

    this.source = null
    this.pipeline = null
    this.target = null

    this.hadError = false

    this.bytesRead = 0
    this.bytesWritten = 0
    this.checksum = {}
  }

  /**
   * @summary Start the writing process
   * @returns {ImageWriter} imageWriter
   * @example
   * imageWriter.write()
   */
  write () {
    this.hadError = false

    this._createWritePipeline(this.options)
      .on('checksum', (checksum) => {
        debug('write:checksum', checksum)
        this.checksum = checksum
      })
      .on('error', (error) => {
        this.hadError = true
        this.emit('error', error)
      })

    this.target.on('finish', () => {
      this.bytesRead = this.source.bytesRead
      this.bytesWritten = this.target.bytesWritten
      if (this.options.verify) {
        this.verify()
      } else {
        this._emitFinish()
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
        this.hadError = true
        this.emit('error', error)
      })
      .on('checksum', (checksum) => {
        debug('verify:checksum', this.checksum, '==', checksum)
        if (!_.isEqual(this.checksum, checksum)) {
          const error = new Error(`Verification failed: ${JSON.stringify(this.checksum)} != ${JSON.stringify(checksum)}`)
          error.code = 'EVALIDATION'
          this.emit('error', error)
        }
        this._emitFinish()
      })
      .on('finish', () => {
        debug('verify:end')

        // NOTE: As the 'checksum' event only happens after
        // the 'finish' event, we `._emitFinish()` there instead of here
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
      this.emit('abort')
      this.source.destroy()
    }
  }

  /**
   * @summary Emits the `finish` event with state metadata
   * @private
   * @example
   * this._emitFinish()
   */
  _emitFinish () {
    this.emit('finish', {
      bytesRead: this.bytesRead,
      bytesWritten: this.bytesWritten,
      checksum: this.checksum
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
      path: options.path,
      flags: options.flags,
      mode: options.mode,
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
      path: options.path,
      flags: options.flags,
      mode: options.mode,
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
