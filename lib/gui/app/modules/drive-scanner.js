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
const Bluebird = require('bluebird')
const fs = Bluebird.promisifyAll(require('fs'))
const path = require('path')
const settings = require('../models/settings')
const SDK = require('../../../sdk')
const permissions = require('../../../shared/permissions')
const packageJSON = require('../../../../package.json')

/**
 * @summary The Etcher "blobs" directory path
 * @type {String}
 * @constant
 */
let BLOBS_DIRECTORY = path.join(__dirname, '..', '..', '..', 'blobs')

// FIXME: When bundled & packaged, the blob path differs
if (packageJSON.packageType !== 'local') {
  BLOBS_DIRECTORY = packageJSON.packageType === 'AppImage'
    ? 'bin/resources/app.asar/lib/blobs'
    : path.join(__dirname, '..', '..', 'blobs')
}

const scanner = SDK.createScanner({
  blockdevice: {
    get includeSystemDrives () {
      return settings.get('unsafeMode')
    }
  },
  usbboot: {
    readFile: (name) => {
      const isRaspberryPi = _.includes([
        'bootcode.bin',
        'start_cd.elf',
        'fixup_cd.dat'
      ], name)

      const blobPath = isRaspberryPi ? path.join('raspberrypi', name) : name

      return fs.readFileAsync(path.join(BLOBS_DIRECTORY, 'usbboot', blobPath))
    }
  }
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
