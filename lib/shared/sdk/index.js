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

const EventEmitter = require('events')
const _ = require('lodash')
const SDK = module.exports
const debug = require('debug')('sdk')

debug.enabled = true

/**
 * @summary The list of loaded adapters
 * @type {Object[]}
 * @constant
 */
const ADAPTERS = [
  require('./standard'),
  require('./usbboot')
]

/**
 * @summary Initialised adapters
 * @type {Object<String,Adapter>}
 * @constant
 */
SDK.adapters = _.reduce(ADAPTERS, (adapters, Adapter) => {
  adapters[Adapter.id] = new Adapter()
  return adapters
}, {})

/* eslint-disable lodash/prefer-lodash-method */

/**
 * Adapter Scanner
 * @class Scanner
 */
SDK.Scanner = class Scanner extends EventEmitter {
  /**
   * @summary Adapter Scanner constructor
   * @param {Object<String,Object>} [options] - device adapter options
   * @param {Object} [options.adapters] - map of external device adapters
   * @example
   * new SDK.Scanner({
   *   standard: { ... },
   *   usbboot: { ... }
   * })
   */
  constructor (options = {}) {
    // Inherit from EventEmitter
    super()

    this.options = options
    this.isScanning = false
    this.adapters = new Map()

    // Bind event handlers to own context to facilitate
    // removing listeners by reference
    this.onDevices = this.onDevices.bind(this)
    this.onError = this.onError.bind(this)

    this.init()
  }

  /**
   * @summary Initialize adapters
   * @private
   * @example
   * // Only to be used internally
   * this.init()
   */
  init () {
    debug('scanner:init', this)
    _.each(_.keys(this.options), (adapterId) => {
      const adapter = SDK.adapters[adapterId] ||
        _.get(this.options, [ 'adapters', adapterId ])

      if (_.isNil(adapter)) {
        throw new Error(`Unknown adapter "${adapterId}"`)
      }

      this.subsribe(adapter)
    })
  }

  /**
   * @summary Event handler for adapter's "device" events
   * @private
   * @example
   * adapter.on('devices', this.onDevices)
   */
  onDevices () {
    const devices = []
    this.adapters.forEach((adapter) => {
      devices.push(...adapter.devices)
    })
    this.emit('devices', devices)
  }

  /**
   * @summary Event handler for adapter's "error" events
   * @param {Error} error - error
   * @private
   * @example
   * adapter.on('error', this.onError)
   */
  onError (error) {
    this.emit('error', error)
  }

  /**
   * @summary Start scanning for devices
   * @public
   * @returns {SDK.Scanner}
   * @example
   * scanner.start()
   */
  start () {
    debug('start', !this.isScanning)
    if (this.isScanning) {
      return this
    }

    this.adapters.forEach((adapter) => {
      const options = this.options[adapter.id]

      /**
       * @summary Run a scan with an adapter
       * @function
       * @private
       * @example
       * runScan()
       */
      const runScan = () => {
        adapter.scan(options, () => {
          if (this.isScanning) {
            setTimeout(runScan, SDK.Scanner.MIN_SCAN_DELAY)
          }
        })
      }

      adapter
        .on('devices', this.onDevices)
        .on('error', this.onError)

      runScan()
    })

    this.emit('start')
    this.isScanning = true

    return this
  }

  /**
   * @summary Stop scanning for devices
   * @public
   * @returns {SDK.Scanner}
   * @example
   * scanner.stop()
   */
  stop () {
    debug('stop', this.isScanning)
    if (!this.isScanning) {
      return this
    }

    this.adapters.forEach((adapter) => {
      // Adapter.stopScan()
      adapter.removeListener('devices', this.onDevices)
      adapter.removeListener('error', this.onError)
    })

    this.isScanning = false
    this.emit('stop')

    return this
  }

  /**
   * @summary Subsribe to an adapter
   * @public
   * @param {Adapter} adapter - device adapter
   * @returns {SDK.Scanner}
   * @example
   * scanner.subscribe(adapter)
   */
  subsribe (adapter) {
    debug('subsribe', adapter)

    if (this.adapters.get(adapter.id)) {
      throw new Error(`Scanner: Already subsribed to ${adapter.id}`)
    }

    this.adapters.set(adapter.id, adapter)
    this.emit('subsribe', adapter)

    return this
  }

  /**
   * @summary Unsubsribe from an adapter
   * @public
   * @param {Adapter} adapter - device adapter
   * @returns {SDK.Scanner}
   * @example
   * scanner.unsubscribe(adapter)
   * // OR
   * scanner.unsubscribe('adapterName')
   */
  unsubscribe (adapter) {
    debug('unsubsribe', adapter)
    const instance = _.isString(adapter) ? this.adapters.get(adapter) : this.adapters.get(adapter.id)

    if (_.isNil(instance)) {
      // Not subscribed
      return this
    }

    this.adapters.delete(instance.name)
    this.emit('unsubsribe', adapter)

    return this
  }
}

/**
 * @summary Minimum delay between scans in ms
 * @const
 * @type {Number}
 */
SDK.Scanner.MIN_SCAN_DELAY = 500

/**
 * @summary Create a new Scanner
 * @param {Object} [options] - options
 * @returns {SDK.Scanner}
 * @example
 * SDK.createScanner({
 *   standard: { ... },
 *   usbboot: { ... }
 * })
 */
SDK.createScanner = (options) => {
  return new SDK.Scanner(options)
}
