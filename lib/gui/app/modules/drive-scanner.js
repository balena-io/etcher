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

const settings = require('../models/settings')
const SDK = require('../../../sdk')
const permissions = require('../../../shared/permissions')

const scanner = SDK.createScanner({
  blockdevice: {
    get includeSystemDrives () {
      return settings.get('unsafeMode') && !process.env.ETCHER_HIDE_UNSAFE_MODE
    }
  },
  usbboot: {}
})

// NOTE: Enable USBBoot on Linux if run as root
permissions.isElevated().then((elevated) => {
  if (elevated && process.platform === 'linux') {
    const UsbbootAdapter = require('../../../sdk/adapters/usbboot')
    const adapter = new UsbbootAdapter()
    scanner.stop()
    scanner.subscribe(adapter)
    scanner.start()
  }
}).catch((error) => {
  console.warn('Could not add usbboot adapter:', error)
})

module.exports = scanner
