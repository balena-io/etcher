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

const Stream = require('stream')
const speedometer = require('speedometer')

const PERCENT = 100
const DEFAULT_TIME_MS = 500

/**
 * @class ProgressStream
 * @public
 */
class ProgressStream extends Stream.Transform {
  /**
   * @summary ProgressStream constructor
   * @param {Object} options - options
   * @param {Number} options.length - expected total
   * @param {Number} [options.time] - time interval to report progress
   * @example
   * new ProgressStream({ length: 1024 * 1024 })
   *   .on('progress', (state) => {
   *     console.log( state.percentage.toFixed(0) + '%' )
   *   })
   */
  constructor (options) {
    super(options)

    this.start = 0
    this.interval = options.time || DEFAULT_TIME_MS
    this.timer = null
    this.meter = speedometer()

    this.delta = 0

    this.state = {
      delta: 0,
      eta: 0,
      length: options.length,
      percentage: 0,
      remaining: 0,
      runtime: 0,
      speed: 0,
      transferred: 0
    }

    this.clear = () => {
      clearInterval(this.timer)
    }

    this.update = () => {
      this.state.delta = this.delta
      this.state.transferred += this.delta
      this.state.percentage = this.state.transferred / this.state.length * PERCENT
      this.state.remaining = this.state.length - this.state.transferred
      this.state.runtime = Date.now() - this.start
      this.state.speed = this.meter(this.state.delta)

      // NOTE: We need to guard against this becoming Infinity,
      // because that value isn't transmitted properly over IPC and becomes `null`
      this.state.eta = this.state.speed ? this.state.remaining / this.state.speed : 0
      this.delta = 0
      this.emit('progress', this.state)
    }

    this.once('end', this.clear)
    this.once('end', this.update)
    this.once('error', this.clear)

    this.timer = setInterval(this.update, this.interval)
  }

  /**
   * @summary Transform function
   * @private
   * @param {Buffer} chunk - chunk
   * @param {String} _ - encoding
   * @param {Function} next - callback
   * @example
   * progressStream.write(buffer)
   */
  _transform (chunk, _, next) {
    this.start = this.start || Date.now()
    this.delta += chunk.length
    next(null, chunk)
  }

  /**
   * @summary Destroy handler
   * @param {Error} [error] - error
   * @param {Function} done - callback
   * @example
   * progressStream.destroy()
   */
  _destroy (error, done) {
    this.clear()
    done(error)
  }
}

module.exports = ProgressStream
