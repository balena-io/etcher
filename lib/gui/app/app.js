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

/**
 * @module Etcher
 */

'use strict'

/* eslint-disable no-var */

var angular = require('angular')

/* eslint-enable no-var */

const electron = require('electron')
const Bluebird = require('bluebird')
const sdk = require('etcher-sdk')
const _ = require('lodash')
const semver = require('semver')
const uuidV4 = require('uuid/v4')

>>>>>>> Show raspberry pi usbboot update progress in devices list
const EXIT_CODES = require('../../shared/exit-codes')
const messages = require('../../shared/messages')
const s3Packages = require('../../shared/s3-packages')
const release = require('../../shared/release')
const store = require('./models/store')
const errors = require('../../shared/errors')
const packageJSON = require('../../../package.json')
const flashState = require('./models/flash-state')
const settings = require('./models/settings')
const windowProgress = require('./os/window-progress')
const analytics = require('./modules/analytics')
const updateNotifier = require('./components/update-notifier')
const availableDrives = require('./models/available-drives')
const selectionState = require('./models/selection-state')
const driveScanner = require('./modules/drive-scanner')
const osDialog = require('./os/dialog')
const exceptionReporter = require('./modules/exception-reporter')
const updateLock = require('./modules/update-lock')

/* eslint-disable lodash/prefer-lodash-method */

// Enable debug information from all modules that use `debug`
// See https://github.com/visionmedia/debug#browser-support
//
// Enable drivelist debugging information
// See https://github.com/resin-io-modules/drivelist
process.env.DRIVELIST_DEBUG = /drivelist|^\*$/i.test(process.env.DEBUG) ? '1' : ''
window.localStorage.debug = process.env.DEBUG

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

const app = angular.module('Etcher', [
  require('angular-ui-router'),
  require('angular-ui-bootstrap'),
  require('angular-if-state'),

  // Components
  require('./components/svg-icon'),
  require('./components/warning-modal/warning-modal'),
  require('./components/safe-webview'),
  require('./components/file-selector'),

  // Pages
  require('./pages/main/main'),
  require('./pages/finish/finish'),
  require('./pages/settings/settings'),

  // OS
  require('./os/open-external/open-external'),
  require('./os/dropzone/dropzone'),

  // Utils
  require('./utils/manifest-bind/manifest-bind')
])

app.run(() => {
  console.log([
    ' _____ _       _',
    '|  ___| |     | |',
    '| |__ | |_ ___| |__   ___ _ __',
    '|  __|| __/ __| \'_ \\ / _ \\ \'__|',
    '| |___| || (__| | | |  __/ |',
    '\\____/ \\__\\___|_| |_|\\___|_|',
    '',
    'Interested in joining the Etcher team?',
    'Drop us a line at join+etcher@resin.io',
    '',
    `Version = ${packageJSON.version}, Type = ${packageJSON.packageType}`
  ].join('\n'))
})

app.run(() => {
  const currentVersion = packageJSON.version

  analytics.logEvent('Application start', {
    packageType: packageJSON.packageType,
    version: currentVersion,
    applicationSessionUuid
  })

  const shouldCheckForUpdates = updateNotifier.shouldCheckForUpdates({
    currentVersion,
    lastSleptUpdateNotifier: settings.get('lastSleptUpdateNotifier'),
    lastSleptUpdateNotifierVersion: settings.get('lastSleptUpdateNotifierVersion')
  })

  const isStableRelease = release.isStableRelease(currentVersion)
  const updatesEnabled = settings.get('updatesEnabled')

  if (!shouldCheckForUpdates || !updatesEnabled) {
    analytics.logEvent('Not checking for updates', {
      shouldCheckForUpdates,
      updatesEnabled,
      stable: isStableRelease,
      applicationSessionUuid
    })

    return Bluebird.resolve()
  }

  const updateSemverRange = packageJSON.updates.semverRange
  const includeUnstableChannel = settings.get('includeUnstableUpdateChannel')

  analytics.logEvent('Checking for updates', {
    currentVersion,
    stable: isStableRelease,
    updateSemverRange,
    includeUnstableChannel,
    applicationSessionUuid
  })

  return s3Packages.getLatestVersion(release.getReleaseType(currentVersion), {
    range: updateSemverRange,
    includeUnstableChannel
  }).then((latestVersion) => {
    if (semver.gte(currentVersion, latestVersion || '0.0.0')) {
      analytics.logEvent('Update notification skipped', {
        reason: 'Latest version',
        applicationSessionUuid
      })
      return Bluebird.resolve()
    }

    // In case the internet connection is not good and checking the
    // latest published version takes too long, only show notify
    // the user about the new version if he didn't start the flash
    // process (e.g: selected an image), otherwise such interruption
    // might be annoying.
    if (selectionState.hasImage()) {
      analytics.logEvent('Update notification skipped', {
        reason: 'Image selected',
        applicationSessionUuid
      })
      return Bluebird.resolve()
    }

    analytics.logEvent('Notifying update', {
      latestVersion,
      applicationSessionUuid
    })

    return updateNotifier.notify(latestVersion, {
      allowSleepUpdateCheck: isStableRelease
    })

  // If the error is an update user error, then we don't want
  // to bother users each time they open the app.
  // See: https://github.com/resin-io/etcher/issues/1525
  }).catch((error) => {
    return errors.isUserError(error) && error.code === 'UPDATE_USER_ERROR'
  }, (error) => {
    analytics.logEvent('Update check user error', {
      title: errors.getTitle(error),
      description: errors.getDescription(error),
      applicationSessionUuid
    })
  }).catch(exceptionReporter.report)
})

app.run(() => {
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
})


app.run(($timeout) => {
  const BLACKLISTED_DRIVES = settings.has('driveBlacklist')
    ? settings.get('driveBlacklist').split(',')
    : []

  function driveIsAllowed(drive) {
    return !(
      BLACKLISTED_DRIVES.includes(drive.devicePath) ||
      BLACKLISTED_DRIVES.includes(drive.device) ||
      BLACKLISTED_DRIVES.includes(drive.raw)
    )
  }

  function prepareDrive(drive) {
    if (drive instanceof sdk.sourceDestination.BlockDevice) {
      return drive.drive
    } else if (drive instanceof sdk.sourceDestination.UsbbootDrive) {
      // This is a workaround etcher expecting a device string and a size
      drive.device = drive.usbDevice.portId
      drive.size = 0
      drive.progress = 0
      drive.on('progress', (progress) => {
        updateDriveProgress(drive, progress)
      })
      return drive
    }
  }

  function setDrives(drives) {
    drives = _.values(drives)
    availableDrives.setDrives(drives)
    // Safely trigger a digest cycle.
    // In some cases, AngularJS doesn't acknowledge that the
    // available drives list has changed, and incorrectly
    // keeps asking the user to "Connect a drive".
    $timeout()
  }

  function getDrives() {
    return _.keyBy(availableDrives.getDrives() || [], 'device')
  }

  function addDrive(drive) {
    drive = prepareDrive(drive)
    if (!driveIsAllowed(drive)) {
      return
    }
    const drives = getDrives()
    drives[drive.device] = drive
    setDrives(drives)
  }

  function removeDrive(drive) {
    drive = prepareDrive(drive)
    const drives = getDrives()
    delete drives[drive.device]
    setDrives(drives)
  }

  function updateDriveProgress(drive, progress) {
    const drives = getDrives()
    const drive_ = drives[drive.device]
    if (drive !== undefined) {
      drive.progress = progress
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
})

app.run(($window) => {
  let popupExists = false

  $window.addEventListener('beforeunload', (event) => {
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

  $window.addEventListener('click', extendLock)
  $window.addEventListener('touchstart', extendLock)

  // Initial update lock acquisition
  extendLock()
})

app.run(($rootScope) => {
  $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState) => {
    // Ignore first navigation
    if (!fromState.name) {
      return
    }

    analytics.logEvent('Navigate', {
      to: toState.name,
      from: fromState.name,
      applicationSessionUuid
    })
  })
})

app.config(($urlRouterProvider) => {
  $urlRouterProvider.otherwise('/main')
})

app.config(($provide) => {
  $provide.decorator('$exceptionHandler', ($delegate) => {
    return (exception, cause) => {
      exceptionReporter.report(exception)
      $delegate(exception, cause)
    }
  })
})

app.config(($locationProvider) => {
  // NOTE(Shou): this seems to invoke a minor perf decrease when set to true
  $locationProvider.html5Mode({
    rewriteLinks: false
  })
})

app.controller('HeaderController', function (OSOpenExternalService) {
  /**
   * @summary Open help page
   * @function
   * @public
   *
   * @description
   * This application will open either the image's support url, declared
   * in the archive `manifest.json`, or the default Etcher help page.
   *
   * @example
   * HeaderController.openHelpPage();
   */
  this.openHelpPage = () => {
    const DEFAULT_SUPPORT_URL = 'https://github.com/resin-io/etcher/blob/master/SUPPORT.md'
    const supportUrl = selectionState.getImageSupportUrl() || DEFAULT_SUPPORT_URL
    OSOpenExternalService.open(supportUrl)
  }

  /**
   * @summary Whether to show the help link
   * @function
   * @public
   *
   * @returns {Boolean}
   *
   * @example
   * HeaderController.shouldShowHelp()
   */
  this.shouldShowHelp = () => {
    return !settings.get('disableExternalLinks')
  }
})

app.controller('StateController', function ($rootScope, $scope) {
  const unregisterStateChange = $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState) => {
    this.previousName = fromState.name
    this.currentName = toState.name
  })

  $scope.$on('$destroy', unregisterStateChange)

  /**
   * @summary Get the previous state name
   * @function
   * @public
   *
   * @returns {String} previous state name
   *
   * @example
   * if (StateController.previousName === 'main') {
   *   console.log('We left the main screen!');
   * }
   */
  this.previousName = null

  /**
   * @summary Get the current state name
   * @function
   * @public
   *
   * @returns {String} current state name
   *
   * @example
   * if (StateController.currentName === 'main') {
   *   console.log('We are on the main screen!');
   * }
   */
  this.currentName = null
})

// Handle keyboard shortcut to open the settings
app.run(($state) => {
  electron.ipcRenderer.on('menu:preferences', () => {
    $state.go('settings')
  })
})

// Ensure user settings are loaded before
// we bootstrap the Angular.js application
angular.element(document).ready(() => {
  settings.load().then(() => {
    angular.bootstrap(document, [ 'Etcher' ])
  }).catch(exceptionReporter.report)
})
