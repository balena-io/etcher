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

const _ = require('lodash')
const os = require('os')

const permissions = require('../../shared/permissions')

/**
 * @summary The list of loaded adapters
 * @type {Object[]}
 * @constant
 */
const ADAPTERS = [
  require('./blockdevice')
]

// On GNU/Linux, we only support usbboot when running as root.
if ((os.platform() !== 'linux') || permissions.isElevatedUnixSync()) {
  ADAPTERS.push(require('./usbboot'))
}

/**
 * @summary Initialised adapters
 * @type {Object<String,Adapter>}
 * @constant
 */
module.exports = _.reduce(ADAPTERS, (adapters, Adapter) => {
  adapters[Adapter.id] = new Adapter()
  return adapters
}, {})
