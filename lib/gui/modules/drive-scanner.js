/*
 * Copyright 2016 resin.io
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

const _ = require('lodash')
const EventEmitter = require('events').EventEmitter
const drivelist = require('drivelist')
const settings = require('../models/settings')
const debug = require('debug')('etcher:drive-scanner')

/**
 * @summary Time to wait in between scan calls
 * @type {Number}
 * @constant
 */
const DRIVE_SCANNER_DELAY_MS = 2000

/**
 * @summary Time to delay the first scan (in milliseconds)
 * @description This prevents the drive scans from kicking
 * off while Etcher is still loading, which would
 * considerably delay the time until the main window shows
 * @type {Number}
 * @constant
 */
const DRIVE_SCANNER_FIRST_SCAN_DELAY_MS = 125

/**
 * @summary DriveScanner class
 * @class
 * @extends {EventEmitter}
 */
class DriveScanner extends EventEmitter {
  /**
   * @summary DriveScanner constructor
   * @example
   * const scanner = new DriveScanner()
   *   .on('error', (error) => { ... })
   *   .on('drives', (drives) => { ... })
   */
  constructor () {
    super()
    this.isRunning = false
    this.timer = null
    this.errorCount = 0
    this.run = this.run.bind(this)
  }

  /**
   * @summary Start the scanner
   * @public
   * @example
   * scanner.start()
   */
  start () {
    debug('start')
    if (this.isRunning) {
      return
    }
    this.isRunning = true
    this.timer = setTimeout(this.run, DRIVE_SCANNER_FIRST_SCAN_DELAY_MS)
  }

  /**
   * @summary Kick off a scan & schedule the next run
   * @private
   * @example
   * scanner.run()
   */
  run () {
    if (!this.isRunning) {
      return
    }

    DriveScanner.scan((error, drives) => {
      debug('scan', error || drives)
      if (error) {
        this.errorCount += 1
        this.emit('error', error)
      } else {
        this.emit('drives', drives)
      }
      if (this.isRunning) {
        this.timer = setTimeout(this.run, DRIVE_SCANNER_DELAY_MS)
      }
    })
  }

  /**
   * @summary Stop scanning for drives
   * @public
   * @example
   * scanner.stop()
   */
  stop () {
    debug('stop')
    this.isRunning = false
    clearTimeout(this.timer)
  }

  /**
   * @summary Scan for drives, optionally filtering out system drives
   * @private
   * @static
   * @param {Function} callback - callback(error, drives)
   * @example
   * DriveScanner.scan((error, drives) => {
   *   ...
   * })
   */
  static scan (callback) {
    drivelist.list((error, drives) => {
      if (error) {
        callback(error)
        return
      }

      let list = drives

      if (!settings.get('unsafeMode')) {
        list = _.reject(drives, {
          system: true
        })
      }

      callback(null, list)
    })
  }
}

module.exports = new DriveScanner()
