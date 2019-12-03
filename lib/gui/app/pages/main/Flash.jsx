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

const React = require('react')
const _ = require('lodash')
const messages = require('../../../../shared/messages')
const flashState = require('../../models/flash-state')
const driveScanner = require('../../modules/drive-scanner')
const progressStatus = require('../../modules/progress-status')
const notification = require('../../os/notification')
const analytics = require('../../modules/analytics')
const imageWriter = require('../../modules/image-writer')
const path = require('path')
const store = require('../../models/store')
const constraints = require('../../../../shared/drive-constraints')
const availableDrives = require('../../models/available-drives')
const selection = require('../../models/selection-state')
const SvgIcon = require('../../components/svg-icon/svg-icon.jsx')
const ProgressButton = require('../../components/progress-button/progress-button.jsx')

const COMPLETED_PERCENTAGE = 100
const SPEED_PRECISION = 2

/**
* @summary Spawn a confirmation warning modal
* @function
* @public
*
* @param {Array<String>} warningMessages - warning messages
* @param {Object} WarningModalService - warning modal service
* @returns {Promise} warning modal promise
*
* @example
* confirmationWarningModal([ 'Hello, World!' ])
*/
const confirmationWarningModal = (warningMessages, WarningModalService) => {
  return WarningModalService.display({
    confirmationLabel: 'Continue',
    rejectionLabel: 'Change',
    description: [
      warningMessages.join('\n\n'),
      'Are you sure you want to continue?'
    ].join(' ')
  })
}

/**
* @summary Display warning tailored to the warning of the current drives-image pair
* @function
* @public
*
* @param {Array<Object>} drives - list of drive objects
* @param {Object} image - image object
* @param {Object} WarningModalService - warning modal service
* @returns {Promise<Boolean>}
*
* @example
* displayTailoredWarning(drives, image).then((ok) => {
*   if (ok) {
*     console.log('No warning was shown or continue was pressed')
*   } else {
*     console.log('Change was pressed')
*   }
* })
*/
const displayTailoredWarning = async (drives, image, WarningModalService) => {
  const warningMessages = []
  for (const drive of drives) {
    if (constraints.isDriveSizeLarge(drive)) {
      warningMessages.push(messages.warning.largeDriveSize(drive))
    } else if (!constraints.isDriveSizeRecommended(drive, image)) {
      warningMessages.push(messages.warning.unrecommendedDriveSize(image, drive))
    }

    // TODO(Shou): we should consider adding the same warning dialog for system drives and remove unsafe mode
  }

  if (!warningMessages.length) {
    return true
  }

  return confirmationWarningModal(warningMessages, WarningModalService)
}

/**
* @summary Flash image to drives
* @function
* @public
*
* @param {Object} $timeout - angular's timeout object
* @param {Object} $state - angular's state object
* @param {Object} WarningModalService - warning modal service
* @param {Object} DriveSelectorService - drive selector service
* @param {Object} FlashErrorModalService - flash error modal service
*
* @example
* flashImageToDrive($timeout, $state, WarningModalService, DriveSelectorService, FlashErrorModalService)
*/
const flashImageToDrive = async ($timeout, $state,
  WarningModalService, DriveSelectorService, FlashErrorModalService) => {
  const devices = selection.getSelectedDevices()
  const image = selection.getImage()
  const drives = _.filter(availableDrives.getDrives(), (drive) => {
    return _.includes(devices, drive.device)
  })

  // eslint-disable-next-line no-magic-numbers
  if (drives.length === 0) {
    return
  }

  const hasDangerStatus = constraints.hasListDriveImageCompatibilityStatus(drives, image)
  if (hasDangerStatus) {
    if (!(await displayTailoredWarning(drives, image, WarningModalService))) {
      DriveSelectorService.open()
      return
    }
  }

  if (flashState.isFlashing()) {
    return
  }

  // Trigger Angular digests along with store updates, as the flash state
  // updates. The angular components won't update without it.
  // TODO: Remove once moved entirely to React
  const unsubscribe = store.observe($timeout)

  // Stop scanning drives when flashing
  // otherwise Windows throws EPERM
  driveScanner.stop()

  const iconPath = '../../../assets/icon.png'
  const basename = path.basename(image.path)
  try {
    await imageWriter.flash(image.path, drives)
    if (!flashState.wasLastFlashCancelled()) {
      const flashResults = flashState.getFlashResults()
      notification.send('Flash complete!', {
        body: messages.info.flashComplete(basename, drives, flashResults.results.devices),
        icon: iconPath
      })
      $state.go('success')
    }
  } catch (error) {
    // When flashing is cancelled before starting above there is no error
    if (!error) {
      return
    }

    notification.send('Oops! Looks like the flash failed.', {
      body: messages.error.flashFailure(path.basename(image.path), drives),
      icon: iconPath
    })

    // TODO: All these error codes to messages translations
    // should go away if the writer emitted user friendly
    // messages on the first place.
    if (error.code === 'EVALIDATION') {
      FlashErrorModalService.show(messages.error.validation())
    } else if (error.code === 'EUNPLUGGED') {
      FlashErrorModalService.show(messages.error.driveUnplugged())
    } else if (error.code === 'EIO') {
      FlashErrorModalService.show(messages.error.inputOutput())
    } else if (error.code === 'ENOSPC') {
      FlashErrorModalService.show(messages.error.notEnoughSpaceInDrive())
    } else if (error.code === 'ECHILDDIED') {
      FlashErrorModalService.show(messages.error.childWriterDied())
    } else {
      FlashErrorModalService.show(messages.error.genericFlashError())
      error.image = basename
      analytics.logException(error)
    }
  } finally {
    availableDrives.setDrives([])
    driveScanner.start()
    unsubscribe()
  }
}

/**
* @summary Get progress button label
* @function
* @public
*
* @returns {String} progress button label
*
* @example
* const label = FlashController.getProgressButtonLabel()
*/
const getProgressButtonLabel = () => {
  if (!flashState.isFlashing()) {
    return 'Flash!'
  }

  return progressStatus.fromFlashState(flashState.getFlashState())
}

const formatSeconds = (totalSeconds) => {
  if (!totalSeconds && !_.isNumber(totalSeconds)) {
    return ''
  }
  // eslint-disable-next-line no-magic-numbers
  const minutes = Math.floor(totalSeconds / 60)
  // eslint-disable-next-line no-magic-numbers
  const seconds = Math.floor(totalSeconds - minutes * 60)

  return `${minutes}m${seconds}s`
}

const Flash = ({
  shouldFlashStepBeDisabled, lastFlashErrorCode, progressMessage,
  $timeout, $state, WarningModalService, DriveSelectorService, FlashErrorModalService
}) => {
  // This is a hack to re-render the component whenever the global state changes. Remove once we get rid of angular and use redux correctly.
  // eslint-disable-next-line no-magic-numbers
  const setRefresh = React.useState(false)[1]
  const state = flashState.getFlashState()
  const isFlashing = flashState.isFlashing()
  const isFlashStepDisabled = shouldFlashStepBeDisabled()
  const flashErrorCode = lastFlashErrorCode()

  React.useEffect(() => {
    return store.observe(() => {
      setRefresh((ref) => !ref)
    })
  }, [])

  return <div className="box text-center">
    <div className="center-block">
      <SvgIcon paths={[ '../../assets/flash.svg' ]} disabled={isFlashStepDisabled}/>
    </div>

    <div className="space-vertical-large">
      <ProgressButton
        tabindex="3"
        striped={state.type === 'verifying'}
        active={isFlashing}
        percentage={state.percentage}
        label={getProgressButtonLabel()}
        disabled={Boolean(flashErrorCode) || isFlashStepDisabled}
        callback={() =>
          flashImageToDrive($timeout, $state, WarningModalService, DriveSelectorService, FlashErrorModalService)}>
      </ProgressButton>

      {
        isFlashing && <button className="button button-link button-abort-write" onClick={imageWriter.cancel}>
          <span className="glyphicon glyphicon-remove-sign"></span>
        </button>
      }
      {
        !_.isNil(state.speed) && state.percentage !== COMPLETED_PERCENTAGE &&
          <p className="step-footer step-footer-split">
            {Boolean(state.speed) && <span >{`${state.speed.toFixed(SPEED_PRECISION)} MB/s`}</span>}
            {!_.isNil(state.eta) && <span>{`ETA: ${formatSeconds(state.eta)}` }</span>}
          </p>
      }

      {
        Boolean(state.failed) && <div className="target-status-wrap">
          <div className="target-status-line target-status-failed">
            <span className="target-status-dot"></span>
            <span className="target-status-quantity">{state.failed}</span>
            <span className="target-status-message">{progressMessage.failed(state.failed)} </span>
          </div>
        </div>
      }
    </div>
  </div>
}

module.exports = Flash
