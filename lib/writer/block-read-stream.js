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
const debug = require('debug')('block-read-stream')
const errors = require('./error-types')

const CHUNK_SIZE = 64 * 1024
const MIN_CHUNK_SIZE = 512

/**
 * @summary I/O retry base timeout, in milliseconds
 * @constant
 * @type {Number}
 */
const RETRY_BASE_TIMEOUT = 100

/**
 * @summary BlockReadStream
 * @class
 */
class BlockReadStream extends stream.Readable {
  /**
   * @summary BlockReadStream constructor
   * @param {Object} [options] - options
   * @param {Number} [options.fd] - file descriptor
   * @param {String} [options.path] - file path
   * @param {String} [options.flags] - file open flags
   * @param {Number} [options.mode] - file mode
   * @param {Number} [options.start] - start offset in bytes
   * @param {Number} [options.end] - end offset in bytes
   * @param {Boolean} [options.autoClose] - automatically close the stream on end
   * @param {Number} [options.maxRetries] - maximum number of retries per read
   * @example
   * new BlockReadStream()
   */
  constructor (options) {
    options = Object.assign({}, BlockReadStream.defaults, options)
    options.objectMode = true

    debug('block-read-stream %j', options)

    super(options)

    this.fs = options.fs
    this.fd = options.fd
    this.path = options.path
    this.flags = options.flags
    this.mode = options.mode
    this.end = options.end || Infinity
    this.autoClose = options.autoClose
    this.maxRetries = options.maxRetries || 5

    this.retries = 0
    this.position = options.start || 0
    this.bytesRead = 0

    this.closed = false
    this.destroyed = false

    this.once('end', function () {
      if (this.autoClose) {
        this.close()
      }
    })

    /**
     * @summary onRead handler
     * @param {Error} error - error
     * @param {Number} bytesRead - bytes read
     * @param {Buffer} buffer - resulting buffer
     * @example
     * fs.read(fd, buffer, 0, length, position, onRead)
     */
    this._onRead = (error, bytesRead, buffer) => {
      if (!error && bytesRead !== buffer.length) {
        error = new Error(`Bytes read mismatch: ${bytesRead} != ${buffer.length}`)
      }

      if (error) {
        const isTransient = errors.isTransientError(error)

        if (isTransient && (this.retries < this.maxRetries)) {
          this.retries += 1
          setTimeout(() => {
            this._read()
          }, RETRY_BASE_TIMEOUT * this.retries)
          return
        } else if (isTransient) {
          error.code = 'EUNPLUGGED'
        }

        if (this.autoClose) {
          this.destroy()
        }

        this.emit('error', error)

        return
      }

      this.retries = 0
      this.bytesRead += bytesRead
      this.position += buffer.length
      this.push(buffer)
    }

    this.open()
  }

  /**
   * @summary Read a chunk from the source
   * @private
   * @example
   * // not to be called directly
   */
  _read () {
    // Wait for file handle to be open
    if (this.fd == null) {
      this.once('open', () => {
        this._read()
      })
      return
    }

    const toRead = this.end - this.position

    if (toRead <= 0) {
      this.push(null)
      return
    }

    const length = Math.min(CHUNK_SIZE, Math.max(MIN_CHUNK_SIZE, toRead))
    const buffer = Buffer.alloc(length)

    this.fs.read(this.fd, buffer, 0, length, this.position, this._onRead)
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
BlockReadStream.defaults = {
  fs,
  fd: null,
  path: null,
  flags: 'r',
  mode: 0o666,
  autoClose: true
}

module.exports = BlockReadStream
