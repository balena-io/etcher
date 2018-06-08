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
const fs = require('fs')
const speedometer = require('speedometer')
const debug = require('debug')('etcher:writer:block-write-stream')
const errors = require('./error-types')

const CHUNK_SIZE = 64 * 1024
const UPDATE_INTERVAL_MS = 1000 / 60

/**
 * @summary I/O retry base timeout, in milliseconds
 * @constant
 * @type {Number}
 */
const RETRY_BASE_TIMEOUT = 100

/**
 * @summary BlockWriteStream
 * @class
 */
class BlockWriteStream extends stream.Writable {
  /**
   * @summary BlockWriteStream constructor
   * @param {Object} [options] - options
   * @param {Number} [options.fd] - file descriptor
   * @param {String} [options.path] - file path
   * @param {String} [options.flags] - file open flags
   * @param {Number} [options.mode] - file mode
   * @param {Boolean} [options.autoClose] - automatically close the stream on end
   * @param {Number} [options.maxRetries] - maximum number of retries per write
   * @example
   * new BlockWriteStream(options)
   */
  constructor (options) {
    options = Object.assign({}, BlockWriteStream.defaults, options)
    options.objectMode = true

    debug('block-write-stream %j', options)

    super(options)

    this._writableState.highWaterMark = 1

    this.fs = options.fs
    this.fd = options.fd
    this.path = options.path
    this.flags = options.flags
    this.mode = options.mode
    this.autoClose = options.autoClose
    this.maxRetries = options.maxRetries || 5

    this.position = 0
    this.bytesRead = 0
    this.blocksRead = 0
    this.bytesWritten = 0
    this.blocksWritten = 0
    this.retries = 0
    this.meter = speedometer()
    this.delta = 0
    this.speed = 0

    this.clear = () => {
      clearInterval(this.timer)
    }

    this.update = () => {
      this.speed = this.meter(this.delta)
      this.delta = 0
    }

    this.once('end', this.clear)
    this.once('error', this.clear)

    this.timer = setInterval(this.update, UPDATE_INTERVAL_MS)

    this.closed = false
    this.destroyed = false

    this.once('finish', function () {
      if (this.autoClose) {
        this.close()
      }
    })

    this._flushing = false
    this._firstBlocks = []

    this.open()
  }

  /**
   * @summary Internal write handler
   * @private
   * @param {Buffer} chunk - chunk buffer
   * @param {String} encoding - chunk encoding
   * @param {Function} next - callback(error, value)
   * @example
   * // Not to be called directly
   */
  _write (chunk, encoding, next) {
    debug('_write', chunk.length, chunk.position, chunk.address)

    // Wait for file handle to be open
    if (this.fd == null) {
      this.once('open', () => {
        this._write(chunk, encoding, next)
      })
      return
    }

    if (this.retries === 0) {
      this.bytesRead += chunk.length
      this.blocksRead += 1
    }

    if (chunk.position == null) {
      chunk.position = this.position
    }

    if (!this._flushing && (chunk.position < CHUNK_SIZE)) {
      this._firstBlocks.push(chunk)
      this.position = chunk.position + chunk.length
      process.nextTick(next)
      return
    }

    if (chunk.position !== this.position) {
      this.position = chunk.position
    }

    fs.write(this.fd, chunk, 0, chunk.length, chunk.position, (error, bytesWritten) => {
      if (!error) {
        this.bytesWritten += bytesWritten
        this.delta += bytesWritten
        this.blocksWritten += 1
        this.position += bytesWritten
        this.retries = 0
        next()
        return
      }

      const isTransient = errors.isTransientError(error)

      if (isTransient && (this.retries < this.maxRetries)) {
        this.retries += 1
        setTimeout(() => {
          this._write(chunk, encoding, next)
        }, RETRY_BASE_TIMEOUT * this.retries)
        return
      } else if (isTransient) {
        error.code = 'EUNPLUGGED'
      }

      next(error)
    })
  }

  /**
   * @summary Write buffered data before a stream ends
   * @private
   * @param {Function} done - callback
   * @example
   * // Called by stream internals
   */
  _final (done) {
    debug('_final')

    /**
     * @summary Write the next chunk of the buffered `_firstBlocks`
     * @param {Error} [error] - error
     * @example
     * writeNext()
     */
    const writeNext = (error) => {
      if (error) {
        this.destroy(error)
        return
      }
      const chunk = this._firstBlocks.pop()
      if (!chunk) {
        done()
        return
      }
      this._write(chunk, null, writeNext)
    }

    this._flushing = true
    writeNext()
  }

  /**
   * @summary Destroy the stream, and emit the passed error
   * @private
   * @param {Error} [error] - error
   * @param {Function} done - callback
   * @example
   * stream.destroy()
   */
  _destroy (error, done) {
    debug('_destroy', error)

    if (this.autoClose) {
      this.close((closeError) => {
        done(error || closeError)
      })
    } else {
      done(error)
    }
  }

  /**
   * @summary Open a handle to the file
   * @private
   * @example
   * this.open()
   */
  open () {
    debug('open')

    if (this.fd != null) {
      this.emit('open', this.fd)
      return
    }

    this.fs.open(this.path, this.flags, this.mode, (error, fd) => {
      if (error) {
        if (this.autoClose) {
          this.destroy()
        }
        this.emit('error', error)
      } else {
        this.fd = fd
        this.emit('open', fd)
      }
    })
  }

  /**
   * @summary Close the underlying resource
   * @param {Function} callback - callback(error)
   * @example
   * blockStream.close((error) => {
   *   // ...
   * })
   */
  close (callback) {
    debug('close')

    if (callback) {
      this.once('close', callback)
    }

    if (this.closed || this.fd == null) {
      if (this.fd == null) {
        this.once('open', () => {
          this.close()
        })
      } else {
        process.nextTick(() => {
          this.emit('close')
        })
      }
      return
    }

    this.closed = true

    this.fs.close(this.fd, (error) => {
      if (error) {
        this.emit('error', error)
      } else {
        this.emit('close')
      }
    })

    this.fd = null
  }
}

/**
 * @summary Default options
 * @type {Object}
 * @constant
 */
BlockWriteStream.defaults = {
  fs,
  fd: null,
  path: null,
  flags: 'w',
  mode: 0o666,
  autoClose: true
}

module.exports = BlockWriteStream
