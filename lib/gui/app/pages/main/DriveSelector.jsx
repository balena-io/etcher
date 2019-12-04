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
const prettyBytes = require('pretty-bytes')
const propTypes = require('prop-types')
const React = require('react')
const driveConstraints = require('../../../../shared/drive-constraints')
const utils = require('../../../../shared/utils')
const TargetSelector = require('../../components/drive-selector/target-selector')
const SvgIcon = require('../../components/svg-icon/svg-icon.jsx')
const selectionState = require('../../models/selection-state')
const settings = require('../../models/settings')
const store = require('../../models/store')
const analytics = require('../../modules/analytics')
const exceptionReporter = require('../../modules/exception-reporter')

/**
 * @summary Get drive title based on device quantity
 * @function
 * @public
 *
 * @returns {String} - drives title
 *
 * @example
 * console.log(getDrivesTitle())
 * > 'Multiple Drives (4)'
 */
const getDrivesTitle = () => {
  const drives = selectionState.getSelectedDrives()

  // eslint-disable-next-line no-magic-numbers
  if (drives.length === 1) {
    return _.head(drives).description || 'Untitled Device'
  }

  // eslint-disable-next-line no-magic-numbers
  if (drives.length === 0) {
    return 'No targets found'
  }

  return `${drives.length} Devices`
}

/**
 * @summary Get drive subtitle
 * @function
 * @public
 *
 * @returns {String} - drives subtitle
 *
 * @example
 * console.log(getDrivesSubtitle())
 * > '32 GB'
 */
const getDrivesSubtitle = () => {
  const drive = selectionState.getCurrentDrive()

  if (drive) {
    return prettyBytes(drive.size)
  }

  return 'Please insert at least one target device'
}

/**
 * @summary Get drive list label
 * @function
 * @public
 *
 * @returns {String} - 'list' of drives separated by newlines
 *
 * @example
 * console.log(getDriveListLabel())
 * > 'My Drive (/dev/disk1)\nMy Other Drive (/dev/disk2)'
 */
const getDriveListLabel = () => {
  return _.join(_.map(selectionState.getSelectedDrives(), (drive) => {
    return `${drive.description} (${drive.displayName})`
  }), '\n')
}

/**
 * @summary Open drive selector
 * @function
 * @public
 * @param {Object} DriveSelectorService - drive selector service
 *
 * @example
 * openDriveSelector(DriveSelectorService);
 */
const openDriveSelector = async (DriveSelectorService) => {
  try {
    const drive = await DriveSelectorService.open()
    if (!drive) {
      return
    }

    selectionState.selectDrive(drive.device)

    analytics.logEvent('Select drive', {
      device: drive.device,
      unsafeMode: settings.get('unsafeMode') && !settings.get('disableUnsafeMode'),
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })
  } catch (error) {
    exceptionReporter.report(error)
  }
}

/**
 * @summary Reselect a drive
 * @function
 * @public
 * @param {Object} DriveSelectorService - drive selector service
 *
 * @example
 * reselectDrive(DriveSelectorService);
 */
const reselectDrive = (DriveSelectorService) => {
  openDriveSelector(DriveSelectorService)
  analytics.logEvent('Reselect drive', {
    applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
    flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
  })
}

/**
 * @summary Get memoized selected drives
 * @function
 * @public
 *
 * @example
 * getMemoizedSelectedDrives()
 */
const getMemoizedSelectedDrives = utils.memoize(selectionState.getSelectedDrives, _.isEqual)

/**
 * @summary Should the drive selection button be shown
 * @function
 * @public
 *
 * @returns {Boolean}
 *
 * @example
 * shouldShowDrivesButton()
 */
const shouldShowDrivesButton = () => {
  return !settings.get('disableExplicitDriveSelection')
}

const getDriveSelectionStateSlice = () => ({
  showDrivesButton: shouldShowDrivesButton(),
  driveListLabel: getDriveListLabel(),
  targets: getMemoizedSelectedDrives()
})

const DriveSelector = ({
  webviewShowing,
  disabled,
  nextStepDisabled,
  hasDrive,
  flashing,
  DriveSelectorService
}) => {
  // TODO: inject these from redux-connector
  const [ {
    showDrivesButton,
    driveListLabel,
    targets
  }, setStateSlice ] = React.useState(getDriveSelectionStateSlice())

  React.useEffect(() => {
    return store.observe(() => {
      setStateSlice(getDriveSelectionStateSlice())
    })
  }, [])

  const showStepConnectingLines = !webviewShowing || !flashing

  return (
    <div className="box text-center relative">

      {showStepConnectingLines && (
        <React.Fragment>
          <div
            className="step-border-left"
            disabled={disabled}
          ></div>
          <div
            className="step-border-right"
            disabled={nextStepDisabled}
          ></div>
        </React.Fragment>
      )}

      <div className="center-block">
        <SvgIcon
          paths={[ '../../assets/drive.svg' ]}
          disabled={disabled}
        />
      </div>

      <div className="space-vertical-large">
        <TargetSelector
          disabled={disabled}
          show={!hasDrive && showDrivesButton}
          tooltip={driveListLabel}
          selection={selectionState}
          openDriveSelector={() => openDriveSelector(DriveSelectorService)}
          reselectDrive={() => reselectDrive(DriveSelectorService)}
          flashing={flashing}
          constraints={driveConstraints}
          targets={targets}
        />
      </div>

    </div>
  )
}

DriveSelector.propTypes = {
  webviewShowing: propTypes.bool,
  disabled: propTypes.bool,
  nextStepDisabled: propTypes.bool,
  hasDrive: propTypes.bool,
  flashing: propTypes.bool
}

module.exports = DriveSelector
