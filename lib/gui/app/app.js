/*
 * Copyright 2016 balena.io
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

/**
 * @module Etcher
 */

'use strict'

const electron = require('electron')
const sdk = require('etcher-sdk')
const _ = require('lodash')
const uuidV4 = require('uuid/v4')

const EXIT_CODES = require('../../shared/exit-codes')
const messages = require('../../shared/messages')
const store = require('./models/store')
const packageJSON = require('../../../package.json')
const flashState = require('./models/flash-state')
const settings = require('./models/settings')
// eslint-disable-next-line node/no-missing-require
const windowProgress = require('./os/window-progress')
const analytics = require('./modules/analytics')
const availableDrives = require('./models/available-drives')
const driveScanner = require('./modules/drive-scanner')
const osDialog = require('./os/dialog')
const exceptionReporter = require('./modules/exception-reporter')
const updateLock = require('./modules/update-lock')

/* eslint-disable lodash/prefer-lodash-method,lodash/prefer-get */

// Enable debug information from all modules that use `debug`
// See https://github.com/visionmedia/debug#browser-support
//
// Enable drivelist debugging information
// See https://github.com/balena-io-modules/drivelist
process.env.DRIVELIST_DEBUG = /drivelist|^\*$/i.test(process.env.DEBUG) ? '1' : ''
window.localStorage.debug = process.env.DEBUG

window.addEventListener('unhandledrejection', (event) => {
  // Promise: event.reason
  // Bluebird: event.detail.reason
  // Anything else: event
  const error = event.reason || (event.detail && event.detail.reason) || event
  analytics.logException(error)
  event.preventDefault()
})

// Set application session UUID
store.dispatch({
  type: store.Actions.SET_APPLICATION_SESSION_UUID,
  data: uuidV4()
})

// Set first flashing workflow UUID
store.dispatch({
  type: store.Actions.SET_FLASHING_WORKFLOW_UUID,
  data: uuidV4()
})

const applicationSessionUuid = store.getState().toJS().applicationSessionUuid
const flashingWorkflowUuid = store.getState().toJS().flashingWorkflowUuid

console.log([
  ' _____ _       _',
  '|  ___| |     | |',
  '| |__ | |_ ___| |__   ___ _ __',
  '|  __|| __/ __| \'_ \\ / _ \\ \'__|',
  '| |___| || (__| | | |  __/ |',
  '\\____/ \\__\\___|_| |_|\\___|_|',
  '',
  'Interested in joining the Etcher team?',
  'Drop us a line at join+etcher@balena.io',
  '',
  `Version = ${packageJSON.version}, Type = ${packageJSON.packageType}`
].join('\n'))

const currentVersion = packageJSON.version

analytics.logEvent('Application start', {
  packageType: packageJSON.packageType,
  version: currentVersion,
  applicationSessionUuid
})

store.observe(() => {
  if (!flashState.isFlashing()) {
    return
  }

  const currentFlashState = flashState.getFlashState()
  const stateType = !currentFlashState.flashing && currentFlashState.verifying
    ? `Verifying ${currentFlashState.verifying}`
    : `Flashing ${currentFlashState.flashing}`

  // NOTE: There is usually a short time period between the `isFlashing()`
  // property being set, and the flashing actually starting, which
  // might cause some non-sense flashing state logs including
  // `undefined` values.
  analytics.logDebug(
    `${stateType} devices, ` +
    `${currentFlashState.percentage}% at ${currentFlashState.speed} MB/s ` +
    `(total ${currentFlashState.totalSpeed} MB/s) ` +
    `eta in ${currentFlashState.eta}s ` +
    `with ${currentFlashState.failed} failed devices`
  )

  windowProgress.set(currentFlashState)
})

/**
 * @summary The radix used by USB ID numbers
 * @type {Number}
 * @constant
 */
const USB_ID_RADIX = 16

/**
 * @summary The expected length of a USB ID number
 * @type {Number}
 * @constant
 */
const USB_ID_LENGTH = 4

/**
 * @summary Convert a USB id (e.g. product/vendor) to a string
 * @function
 * @private
 *
 * @param {Number} id - USB id
 * @returns {String} string id
 *
 * @example
 * console.log(usbIdToString(2652))
 * > '0x0a5c'
 */
const usbIdToString = (id) => {
  return `0x${_.padStart(id.toString(USB_ID_RADIX), USB_ID_LENGTH, '0')}`
}

/**
 * @summary Product ID of BCM2708
 * @type {Number}
 * @constant
 */
const USB_PRODUCT_ID_BCM2708_BOOT = 0x2763

/**
 * @summary Product ID of BCM2710
 * @type {Number}
 * @constant
 */
const USB_PRODUCT_ID_BCM2710_BOOT = 0x2764

/**
 * @summary Compute module descriptions
 * @type {Object}
 * @constant
 */
const COMPUTE_MODULE_DESCRIPTIONS = {
  [USB_PRODUCT_ID_BCM2708_BOOT]: 'Compute Module 1',
  [USB_PRODUCT_ID_BCM2710_BOOT]: 'Compute Module 3'
}

const BLACKLISTED_DRIVES = settings.has('driveBlacklist')
  ? settings.get('driveBlacklist').split(',')
  : []

// eslint-disable-next-line require-jsdoc
const driveIsAllowed = (drive) => {
  return !(
    BLACKLISTED_DRIVES.includes(drive.devicePath) ||
    BLACKLISTED_DRIVES.includes(drive.device) ||
    BLACKLISTED_DRIVES.includes(drive.raw)
  )
}

// eslint-disable-next-line require-jsdoc,consistent-return
const prepareDrive = (drive) => {
  if (drive instanceof sdk.sourceDestination.BlockDevice) {
    return drive.drive
  } else if (drive instanceof sdk.sourceDestination.UsbbootDrive) {
    // This is a workaround etcher expecting a device string and a size
    drive.device = drive.usbDevice.portId
    drive.size = null
    drive.progress = 0
    drive.disabled = true
    drive.on('progress', (progress) => {
      updateDriveProgress(drive, progress)
    })
    return drive
  } else if (drive instanceof sdk.sourceDestination.DriverlessDevice) {
    const description = COMPUTE_MODULE_DESCRIPTIONS[drive.deviceDescriptor.idProduct] || 'Compute Module'
    return {
      device: `${usbIdToString(drive.deviceDescriptor.idVendor)}:${usbIdToString(drive.deviceDescriptor.idProduct)}`,
      displayName: 'Missing drivers',
      description,
      mountpoints: [],
      isReadOnly: false,
      isSystem: false,
      disabled: true,
      icon: 'warning',
      size: null,
      link: 'https://www.raspberrypi.org/documentation/hardware/computemodule/cm-emmc-flashing.md',
      linkCTA: 'Install',
      linkTitle: 'Install missing drivers',
      linkMessage: [
        'Would you like to download the necessary drivers from the Raspberry Pi Foundation?',
        'This will open your browser.\n\n',
        'Once opened, download and run the installer from the "Windows Installer" section to install the drivers.'
      ].join(' ')
    }
  }
}

// eslint-disable-next-line require-jsdoc
const setDrives = (drives) => {
  availableDrives.setDrives(_.values(drives))
}

// eslint-disable-next-line require-jsdoc
const getDrives = () => {
  return _.keyBy(availableDrives.getDrives() || [], 'device')
}

// eslint-disable-next-line require-jsdoc
const addDrive = (drive) => {
  const preparedDrive = prepareDrive(drive)
  if (!driveIsAllowed(preparedDrive)) {
    return
  }
  const drives = getDrives()
  drives[preparedDrive.device] = preparedDrive
  setDrives(drives)
}

// eslint-disable-next-line require-jsdoc
const removeDrive = (drive) => {
  const preparedDrive = prepareDrive(drive)
  const drives = getDrives()
  // eslint-disable-next-line prefer-reflect
  delete drives[preparedDrive.device]
  setDrives(drives)
}

// eslint-disable-next-line require-jsdoc
const updateDriveProgress = (drive, progress) => {
  const drives = getDrives()
  const driveInMap = drives[drive.device]
  if (driveInMap) {
    driveInMap.progress = progress
    setDrives(drives)
  }
}

driveScanner.on('attach', addDrive)
driveScanner.on('detach', removeDrive)

driveScanner.on('error', (error) => {
  // Stop the drive scanning loop in case of errors,
  // otherwise we risk presenting the same error over
  // and over again to the user, while also heavily
  // spamming our error reporting service.
  driveScanner.stop()

  return exceptionReporter.report(error)
})

driveScanner.start()

let popupExists = false

window.addEventListener('beforeunload', (event) => {
  if (!flashState.isFlashing() || popupExists) {
    analytics.logEvent('Close application', {
      isFlashing: flashState.isFlashing(),
      applicationSessionUuid
    })
    return
  }

  // Don't close window while flashing
  event.returnValue = false

  // Don't open any more popups
  popupExists = true

  analytics.logEvent('Close attempt while flashing', { applicationSessionUuid, flashingWorkflowUuid })

  osDialog.showWarning({
    confirmationLabel: 'Yes, quit',
    rejectionLabel: 'Cancel',
    title: 'Are you sure you want to close Etcher?',
    description: messages.warning.exitWhileFlashing()
  }).then((confirmed) => {
    if (confirmed) {
      analytics.logEvent('Close confirmed while flashing', {
        flashInstanceUuid: flashState.getFlashUuid(),
        applicationSessionUuid,
        flashingWorkflowUuid
      })

      // This circumvents the 'beforeunload' event unlike
      // electron.remote.app.quit() which does not.
      electron.remote.process.exit(EXIT_CODES.SUCCESS)
    }

    analytics.logEvent('Close rejected while flashing', { applicationSessionUuid, flashingWorkflowUuid })
    popupExists = false
  }).catch(exceptionReporter.report)
})

/**
 * @summary Helper fn for events
 * @function
 * @private
 * @example
 * window.addEventListener('click', extendLock)
 */
const extendLock = () => {
  updateLock.extend()
}

window.addEventListener('click', extendLock)
window.addEventListener('touchstart', extendLock)

// Initial update lock acquisition
extendLock()

settings.load().catch(exceptionReporter.report)

require('./tsapp.tsx')
