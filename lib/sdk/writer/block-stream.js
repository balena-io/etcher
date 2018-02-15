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
const debug = require('debug')('block-stream')

const MIN_BLOCK_SIZE = 512
const CHUNK_SIZE = 64 * 1024

/**
 * @summary BlockStream class
 * @class
 */
class BlockStream extends stream.Transform {
  /**
   * @summary BlockStream constructor
   * @param {Object} [options] - options
   * @param {Number} [options.blockSize] - block size in bytes
   * @param {Number} [options.chunkSize] - chunk size in bytes
   * @example
   * new BlockStream(options)
   */
  constructor (options) {
    options = Object.assign({}, BlockStream.defaults, options)
    options.readableObjectMode = true

    super(options)

    this.blockSize = options.blockSize
    this.chunkSize = options.chunkSize
    this.bytesRead = 0
    this.bytesWritten = 0

    this._buffers = []
    this._bytes = 0

    debug('new %j', options)
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
  _transform (chunk, encoding, next) {
    this.bytesRead += chunk.length

    if (this._bytes === 0 && chunk.length >= this.chunkSize) {
      if (chunk.length % this.blockSize === 0) {
        this.bytesWritten += chunk.length
        this.push(chunk)
        next()
        return
      }
    }

    this._buffers.push(chunk)
    this._bytes += chunk.length

    if (this._bytes >= this.chunkSize) {
      let block = Buffer.concat(this._buffers)
      const length = Math.floor(block.length / this.blockSize) * this.blockSize

      this._buffers.length = 0
      this._bytes = 0

      if (block.length !== length) {
        this._buffers.push(block.slice(length))
        this._bytes += block.length - length
        block = block.slice(0, length)
      }

      this.bytesWritten += block.length
      this.push(block)
    }

    next()
  }

  /**
   * @summary Internal stream end handler
   * @private
   * @param {Function} done - callback(error, value)
   * @example
   * // Not to be called directly
   */
  _flush (done) {
    if (!this._bytes) {
      done()
      return
    }

    const length = Math.ceil(this._bytes / this.blockSize) * this.blockSize
    const block = Buffer.alloc(length)
    let offset = 0

    for (let index = 0; index < this._buffers.length; index += 1) {
      this._buffers[index].copy(block, offset)
      offset += this._buffers[index].length
    }

    this.push(block)
    done()
  }
}

/**
 * @summary Default options
 * @type {Object}
 * @constant
 */
BlockStream.defaults = {
  blockSize: MIN_BLOCK_SIZE,
  chunkSize: CHUNK_SIZE
}

module.exports = BlockStream
