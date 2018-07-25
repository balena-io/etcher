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
const crypto = require('crypto')
const xxhash = require('xxhash')
const _ = require('lodash')

/**
 * @summary Create an instance of ChecksumStream
 * @name ChecksumStream
 * @class
 */
class ChecksumStream extends stream.Transform {
  /**
   * @summary Create an instance of ChecksumStream
   * @name ChecksumStream
   * @class
   * @param {Object} options - options
   * @param {String[]} options.algorithms - hash algorithms
   * @example
   * var checksum = new ChecksumStream({
   *   algorithms: [ 'md5' ]
   * })
   *
   * checksum.once('checksum', (checksum) => {
   *   // checksum: {
   *   //   md5: '55a4eb779e08f604c41ba1cbfff47ada'
   *   // }
   * })
   *
   * fs.createReadStream( 'os-image.img' )
   *   .pipe( checksum )
   *   .pipe( fs.createWriteStream( '/dev/rdisk2' ) )
   *   .once( 'finish', () => { ... })
   */
  constructor (options = {}) {
    super(options)
    this.results = {}
    this.algorithms = options.algorithms || []
    this.hashes = _.map(this.algorithms, (algorithm) => {
      return this._createHash(algorithm)
    })
  }

  /**
   * @summary Create & pipe to the Hash streams
   * @private
   * @param {String[]} algorithm - hash algorithm
   * @returns {Stream}
   * @example
   * const hash = this._createHash(algorithm)
   */
  _createHash (algorithm) {
    let hash = null

    if (algorithm === 'xxhash') {
      // Seed value 0x45544348 = ASCII "ETCH"
      const seed = 0x45544348
      const is64Bit = process.arch === 'x64' || process.arch === 'aarch64'
      hash = new xxhash.Stream(seed, is64Bit ? 64 : 32)
    } else {
      hash = _.attempt(crypto.createHash, algorithm)
    }

    if (_.isError(hash)) {
      hash.message += ` "${algorithm}"`
      throw hash
    }

    /**
     * @summary Check for all checksums to have been calculated
     * @private
     * @example
     * hash.once('end', check)
     */
    const check = () => {
      if (_.keys(this.results).length === this.algorithms.length) {
        this.emit('checksum', _.clone(this.results))
      }
    }

    hash.once('error', (error) => {
      return this.emit('error', error)
    })

    hash.once('readable', () => {
      this.results[algorithm] = hash.read().toString('hex')
      check()
    })

    return hash
  }

  /**
   * @summary Pass through chunks
   * @private
   * @param {Buffer} chunk - chunk
   * @param {String} encoding - encoding
   * @param {Function} next - callback
   * @example
   * checksumStream.write(buffer)
   */
  _transform (chunk, encoding, next) {
    for (let index = 0; index < this.hashes.length; index += 1) {
      this.hashes[index].write(chunk)
    }
    next(null, chunk)
  }

  /**
   * @summary End the hash streams once this stream ends
   * @private
   * @param {Function} done - callback
   * @example
   * checksumStream.end()
   */
  _flush (done) {
    for (let index = 0; index < this.hashes.length; index += 1) {
      this.hashes[index].end()
    }
    done()
  }
}

module.exports = ChecksumStream
