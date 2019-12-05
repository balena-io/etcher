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

const { Modal, Txt } = require('rendition')
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

const getWarningMessages = (drives, image) => {
  const warningMessages = []
  for (const drive of drives) {
    if (constraints.isDriveSizeLarge(drive)) {
      warningMessages.push(messages.warning.largeDriveSize(drive))
    } else if (!constraints.isDriveSizeRecommended(drive, image)) {
      warningMessages.push(messages.warning.unrecommendedDriveSize(image, drive))
    }

    // TODO(Shou): we should consider adding the same warning dialog for system drives and remove unsafe mode
  }

  return warningMessages
}

const getErrorMessageFromCode = (errorCode) => {
  // TODO: All these error codes to messages translations
  // should go away if the writer emitted user friendly
  // messages on the first place.
  if (errorCode === 'EVALIDATION') {
    return messages.error.validation()
  } else if (errorCode === 'EUNPLUGGED') {
    return messages.error.driveUnplugged()
  } else if (errorCode === 'EIO') {
    return messages.error.inputOutput()
  } else if (errorCode === 'ENOSPC') {
    return messages.error.notEnoughSpaceInDrive()
  } else if (errorCode === 'ECHILDDIED') {
    return messages.error.childWriterDied()
  }
  return ''
}

const flashImageToDrive = async ($timeout, $state) => {
  const devices = selection.getSelectedDevices()
  const image = selection.getImage()
  const drives = _.filter(availableDrives.getDrives(), (drive) => {
    return _.includes(devices, drive.device)
  })

  // eslint-disable-next-line no-magic-numbers
  if (drives.length === 0 || flashState.isFlashing()) {
    return ''
  }

  // Trigger Angular digests along with store updates, as the flash state
  // updates. The angular components won't update without it.
  // TODO: Remove once moved entirely to React
  const unsubscribe = store.observe($timeout)

  // Stop scanning drives when flashing
  // otherwise Windows throws EPERM
  driveScanner.stop()

  const iconPath = '../../assets/icon.png'
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
      return ''
    }

    notification.send('Oops! Looks like the flash failed.', {
      body: messages.error.flashFailure(path.basename(image.path), drives),
      icon: iconPath
    })

    let errorMessage = getErrorMessageFromCode(error.code)
    if (!errorMessage) {
      error.image = basename
      analytics.logException(error)
      errorMessage = messages.error.genericFlashError()
    }

    return errorMessage
  } finally {
    availableDrives.setDrives([])
    driveScanner.start()
    unsubscribe()
  }

  // Return ''
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
  $timeout, $state, DriveSelectorService
}) => {
  const state = flashState.getFlashState()
  const isFlashing = flashState.isFlashing()
  const flashErrorCode = lastFlashErrorCode()

  const [ warningMessages, setWarningMessages ] = React.useState([])
  const [ errorMessage, setErrorMessage ] = React.useState('')

  const handleWarningResponse = async (shouldContinue) => {
    setWarningMessages([])

    if (!shouldContinue) {
      DriveSelectorService.open()
      return
    }

    setErrorMessage(await flashImageToDrive($timeout, $state))
  }

  const handleFlashErrorResponse = (shouldRetry) => {
    setErrorMessage('')
    flashState.resetState()
    if (shouldRetry) {
      analytics.logEvent('Restart after failure', {
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      })
    } else {
      selection.clear()
    }
  }

  const tryFlash = async () => {
    const devices = selection.getSelectedDevices()
    const image = selection.getImage()
    const drives = _.filter(availableDrives.getDrives(), (drive) => {
      return _.includes(devices, drive.device)
    })

    // eslint-disable-next-line no-magic-numbers
    if (drives.length === 0 || flashState.isFlashing()) {
      return
    }

    const hasDangerStatus = constraints.hasListDriveImageCompatibilityStatus(drives, image)
    if (hasDangerStatus) {
      setWarningMessages(getWarningMessages(drives, image))
      return
    }

    setErrorMessage(await flashImageToDrive($timeout, $state))
  }

  return <React.Fragment>
    <div className="box text-center">
      <div className="center-block">
        <SvgIcon paths={[ '../../assets/flash.svg' ]} disabled={shouldFlashStepBeDisabled}/>
      </div>

      <div className="space-vertical-large">
        <ProgressButton
          tabindex="3"
          striped={state.type === 'verifying'}
          active={isFlashing}
          percentage={state.percentage}
          label={getProgressButtonLabel()}
          disabled={Boolean(flashErrorCode) || shouldFlashStepBeDisabled}
          callback={tryFlash}>
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

    {/* eslint-disable-next-line no-magic-numbers */}
    {warningMessages && warningMessages.length > 0 && <Modal
      width={400}
      titleElement={'Attention'}
      cancel={() => handleWarningResponse(false)}
      done={() => handleWarningResponse(true)}
      cancelButtonProps={{
        children: 'Change'
      }}
      action={'Continue'}
      primaryButtonProps={{ primary: false, warning: true }}
    >
      {
        _.map(warningMessages, (message) => <Txt whitespace="pre-line" mt={2}>{message}</Txt>)
      }
    </Modal>
    }

    {errorMessage && <Modal
      width={400}
      titleElement={'Attention'}
      cancel={() => handleFlashErrorResponse(false)}
      done={() => handleFlashErrorResponse(true)}
      action={'Retry'}
    >
      <Txt>{errorMessage}</Txt>
    </Modal>
    }

  </React.Fragment>
}

module.exports = Flash
