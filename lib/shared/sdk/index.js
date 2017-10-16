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

/**
 * @summary The list of loaded adaptors
 * @type {Object[]}
 * @constant
 */
const ADAPTORS = [
  require('./standard'),
  require('./usbboot')
]

/**
 * @summary Scan for drives using all registered adaptors
 * @function
 * @public
 *
 * @description
 * The options object contains options for all the registered
 * adaptors. For the `standard` adaptor, for example, place
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
exports.scan = (options) => {
  return Bluebird.all(_.map(ADAPTORS, (adaptor) => {
    return new Bluebird((resolve, reject) => {
      adaptor.scan(_.get(options, [ adaptor.name ], {}))
        .on('done', resolve)
        .on('error', reject)
    })
  })).then(_.flatten)
}
