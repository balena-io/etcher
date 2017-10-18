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

const Bluebird = require('bluebird')
const _ = require('lodash')
const sdk = module.exports

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
sdk.adapters = _.reduce(ADAPTERS, (adapters, Adapter) => {
  adapters[Adapter.name] = new Adapter()
  return adapters
}, {})

/**
 * @summary Scan for drives using all registered adapters
 * @function
 * @public
 *
 * @description
 * The options object contains options for all the registered
 * adapters. For the `standard` adapter, for example, place
 * options in `options.standard`.
 *
 * @param {Object} options - options
 * @fulfil {Object[]} - drives
 * @returns {Promise}
 *
 * @example
 * sdk.scan({
 *   standard: {
 *     includeSystemDrives: true
 *   }
 * }).then((drives) => {
 *   console.log(drives)
 * })
 */
sdk.scan = (options) => {
  return Bluebird.all(_.map(sdk.adapters, (adapter) => {
    return new Bluebird((resolve, reject) => {
      adapter.scan(_.get(options, [ adapter.id ], {}), (error, devices) => {
        if (error) {
          reject(error)
        } else {
          resolve(devices)
        }
      })
    })
  })).then(_.flatten)
}
