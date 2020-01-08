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

'use strict'

const Immutable = require('immutable')
const _ = require('lodash')
const redux = require('redux')
const uuidV4 = require('uuid/v4')
const constraints = require('../../../shared/drive-constraints')
// eslint-disable-next-line node/no-missing-require
const supportedFormats = require('../../../shared/supported-formats')
// eslint-disable-next-line node/no-missing-require
const errors = require('../../../shared/errors')
// eslint-disable-next-line node/no-missing-require
const fileExtensions = require('../../../shared/file-extensions')
// eslint-disable-next-line node/no-missing-require
const utils = require('../../../shared/utils')
const settings = require('./settings')

/**
 * @summary Verify and throw if any state fields are nil
 * @function
 * @public
 *
 * @param {Object} object - state object
 * @param {Array<Array<String>> | Array<String>} fields - array of object field paths
 * @param {String} name - name of the state we're dealing with
 * @throws
 *
 * @example
 * const fields = [ 'type', 'percentage' ]
 * verifyNoNilFields(action.data, fields, 'flash')
 */
const verifyNoNilFields = (object, fields, name) => {
  const nilFields = _.filter(fields, (field) => {
    return _.isNil(_.get(object, field))
  })
  if (nilFields.length) {
    throw new Error(`Missing ${name} fields: ${nilFields.join(', ')}`)
  }
}

/**
 * @summary FLASH_STATE fields that can't be nil
 * @constant
 * @private
 */
const flashStateNoNilFields = [
  'speed',
  'totalSpeed'
]

/**
 * @summary SELECT_IMAGE fields that can't be nil
 * @constant
 * @private
 */
const selectImageNoNilFields = [
  'path',
  'extension'
]

/**
 * @summary Application default state
 * @type {Object}
 * @constant
 * @private
 */
const DEFAULT_STATE = Immutable.fromJS({
  applicationSessionUuid: '',
  flashingWorkflowUuid: '',
  availableDrives: [],
  selection: {
    devices: new Immutable.OrderedSet()
  },
  isFlashing: false,
  flashResults: {},
  flashState: {
    flashing: 0,
    verifying: 0,
    successful: 0,
    failed: 0,
    percentage: 0,
    speed: null,
    totalSpeed: null
  }
})

/**
 * @summary Application supported action messages
 * @type {Object}
 * @constant
 */
const ACTIONS = _.fromPairs(_.map([
  'SET_AVAILABLE_DRIVES',
  'SET_FLASH_STATE',
  'RESET_FLASH_STATE',
  'SET_FLASHING_FLAG',
  'UNSET_FLASHING_FLAG',
  'SELECT_DRIVE',
  'SELECT_IMAGE',
  'DESELECT_DRIVE',
  'DESELECT_IMAGE',
  'SET_APPLICATION_SESSION_UUID',
  'SET_FLASHING_WORKFLOW_UUID'
], (message) => {
  return [ message, message ]
}))

/**
 * @summary Get available drives from the state
 * @function
 * @public
 *
 * @param {Object} state - state object
 * @returns {Object} new state
 *
 * @example
 * const drives = getAvailableDrives(state)
 * _.find(drives, { device: '/dev/sda' })
 */
const getAvailableDrives = (state) => {
  // eslint-disable-next-line lodash/prefer-lodash-method
  return state.get('availableDrives').toJS()
}

/**
 * @summary The redux store reducer
 * @function
 * @private
 *
 * @param {Object} state - application state
 * @param {Object} action - dispatched action
 * @returns {Object} new application state
 *
 * @example
 * const newState = storeReducer(DEFAULT_STATE, {
 *   type: ACTIONS.DESELECT_DRIVE
 * });
 */
const storeReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
    case ACTIONS.SET_AVAILABLE_DRIVES: {
      // Type: action.data : Array<DriveObject>

      if (!action.data) {
        throw errors.createError({
          title: 'Missing drives'
        })
      }

      const drives = action.data

      if (!_.isArray(drives) || !_.every(drives, _.isObject)) {
        throw errors.createError({
          title: `Invalid drives: ${drives}`
        })
      }

      const newState = state.set('availableDrives', Immutable.fromJS(drives))
      const selectedDevices = newState.getIn([ 'selection', 'devices' ]).toJS()

      // Remove selected drives that are stale, i.e. missing from availableDrives
      const nonStaleNewState = _.reduce(selectedDevices, (accState, device) => {
        // Check whether the drive still exists in availableDrives
        if (device && !_.find(drives, {
          device
        })) {
          // Deselect this drive gone from availableDrives
          return storeReducer(accState, {
            type: ACTIONS.DESELECT_DRIVE,
            data: device
          })
        }

        return accState
      }, newState)

      const shouldAutoselectAll = Boolean(settings.get('disableExplicitDriveSelection'))
      const AUTOSELECT_DRIVE_COUNT = 1
      const nonStaleSelectedDevices = nonStaleNewState.getIn([ 'selection', 'devices' ]).toJS()
      const hasSelectedDevices = nonStaleSelectedDevices.length >= AUTOSELECT_DRIVE_COUNT
      const shouldAutoselectOne = drives.length === AUTOSELECT_DRIVE_COUNT && !hasSelectedDevices

      if (shouldAutoselectOne || shouldAutoselectAll) {
        // Even if there's no image selected, we need to call several
        // drive/image related checks, and `{}` works fine with them
        const image = state.getIn([ 'selection', 'image' ], Immutable.fromJS({})).toJS()

        return _.reduce(drives, (accState, drive) => {
          if (_.every([
            constraints.isDriveValid(drive, image),
            constraints.isDriveSizeRecommended(drive, image),

            // We don't want to auto-select large drives
            !constraints.isDriveSizeLarge(drive),

            // We don't want to auto-select system drives,
            // even when "unsafe mode" is enabled
            !constraints.isSystemDrive(drive)

          ]) || (shouldAutoselectAll && constraints.isDriveValid(drive, image))) {
            // Auto-select this drive
            return storeReducer(accState, {
              type: ACTIONS.SELECT_DRIVE,
              data: drive.device
            })
          }

          // Deselect this drive in case it still is selected
          return storeReducer(accState, {
            type: ACTIONS.DESELECT_DRIVE,
            data: drive.device
          })
        }, nonStaleNewState)
      }

      return nonStaleNewState
    }

    case ACTIONS.SET_FLASH_STATE: {
      // Type: action.data : FlashStateObject

      if (!state.get('isFlashing')) {
        throw errors.createError({
          title: 'Can\'t set the flashing state when not flashing'
        })
      }

      verifyNoNilFields(action.data, flashStateNoNilFields, 'flash')

      if (!_.every(_.pick(action.data, [
        'flashing',
        'verifying',
        'successful',
        'failed'
      ]), _.isFinite)) {
        throw errors.createError({
          title: 'State quantity field(s) not finite number'
        })
      }

      if (!_.isUndefined(action.data.percentage) && !utils.isValidPercentage(action.data.percentage)) {
        throw errors.createError({
          title: `Invalid state percentage: ${action.data.percentage}`
        })
      }

      if (!_.isUndefined(action.data.eta) && !_.isNumber(action.data.eta)) {
        throw errors.createError({
          title: `Invalid state eta: ${action.data.eta}`
        })
      }

      return state.set('flashState', Immutable.fromJS(action.data))
    }

    case ACTIONS.RESET_FLASH_STATE: {
      return state
        .set('isFlashing', false)
        .set('flashState', DEFAULT_STATE.get('flashState'))
        .set('flashResults', DEFAULT_STATE.get('flashResults'))
        .delete('flashUuid')
    }

    case ACTIONS.SET_FLASHING_FLAG: {
      return state
        .set('isFlashing', true)
        .set('flashUuid', uuidV4())
        .set('flashResults', DEFAULT_STATE.get('flashResults'))
    }

    case ACTIONS.UNSET_FLASHING_FLAG: {
      // Type: action.data : FlashResultsObject

      if (!action.data) {
        throw errors.createError({
          title: 'Missing results'
        })
      }

      _.defaults(action.data, {
        cancelled: false
      })

      if (!_.isBoolean(action.data.cancelled)) {
        throw errors.createError({
          title: `Invalid results cancelled: ${action.data.cancelled}`
        })
      }

      if (action.data.cancelled && action.data.sourceChecksum) {
        throw errors.createError({
          title: 'The sourceChecksum value can\'t exist if the flashing was cancelled'
        })
      }

      if (action.data.sourceChecksum && !_.isString(action.data.sourceChecksum)) {
        throw errors.createError({
          title: `Invalid results sourceChecksum: ${action.data.sourceChecksum}`
        })
      }

      if (action.data.errorCode && !_.isString(action.data.errorCode) && !_.isNumber(action.data.errorCode)) {
        throw errors.createError({
          title: `Invalid results errorCode: ${action.data.errorCode}`
        })
      }

      return state
        .set('isFlashing', false)
        .set('flashResults', Immutable.fromJS(action.data))
        .set('flashState', DEFAULT_STATE.get('flashState'))
    }

    case ACTIONS.SELECT_DRIVE: {
      // Type: action.data : String

      const device = action.data

      if (!device) {
        throw errors.createError({
          title: 'Missing drive'
        })
      }

      if (!_.isString(device)) {
        throw errors.createError({
          title: `Invalid drive: ${device}`
        })
      }

      const selectedDrive = _.find(getAvailableDrives(state), { device })

      if (!selectedDrive) {
        throw errors.createError({
          title: `The drive is not available: ${device}`
        })
      }

      if (selectedDrive.isReadOnly) {
        throw errors.createError({
          title: 'The drive is write-protected'
        })
      }

      const image = state.getIn([ 'selection', 'image' ])
      if (image && !constraints.isDriveLargeEnough(selectedDrive, image.toJS())) {
        throw errors.createError({
          title: 'The drive is not large enough'
        })
      }

      const selectedDevices = state.getIn([ 'selection', 'devices' ])

      return state.setIn([ 'selection', 'devices' ], selectedDevices.add(device))
    }

    // TODO(jhermsmeier): Consolidate these assertions
    // with image-stream / supported-formats, and have *one*
    // place where all the image extension / format handling
    // takes place, to avoid having to check 2+ locations with different logic
    case ACTIONS.SELECT_IMAGE: {
      // Type: action.data : ImageObject

      verifyNoNilFields(action.data, selectImageNoNilFields, 'image')

      if (!_.isString(action.data.path)) {
        throw errors.createError({
          title: `Invalid image path: ${action.data.path}`
        })
      }

      if (!_.isString(action.data.extension)) {
        throw errors.createError({
          title: `Invalid image extension: ${action.data.extension}`
        })
      }

      const extension = _.toLower(action.data.extension)

      if (!_.includes(supportedFormats.getAllExtensions(), extension)) {
        throw errors.createError({
          title: `Invalid image extension: ${action.data.extension}`
        })
      }

      let lastImageExtension = fileExtensions.getLastFileExtension(action.data.path)
      lastImageExtension = _.isString(lastImageExtension) ? _.toLower(lastImageExtension) : lastImageExtension

      if (lastImageExtension !== extension) {
        if (!_.isString(action.data.archiveExtension)) {
          throw errors.createError({
            title: 'Missing image archive extension'
          })
        }

        const archiveExtension = _.toLower(action.data.archiveExtension)

        if (!_.includes(supportedFormats.getAllExtensions(), archiveExtension)) {
          throw errors.createError({
            title: `Invalid image archive extension: ${action.data.archiveExtension}`
          })
        }

        if (lastImageExtension !== archiveExtension) {
          throw errors.createError({
            title: `Image archive extension mismatch: ${action.data.archiveExtension} and ${lastImageExtension}`
          })
        }
      }

      const MINIMUM_IMAGE_SIZE = 0

      // eslint-disable-next-line no-undefined
      if (action.data.size !== undefined) {
        if ((action.data.size < MINIMUM_IMAGE_SIZE) || !_.isInteger(action.data.size)) {
          throw errors.createError({
            title: `Invalid image size: ${action.data.size}`
          })
        }
      }

      if (!_.isUndefined(action.data.compressedSize)) {
        if ((action.data.compressedSize < MINIMUM_IMAGE_SIZE) || !_.isInteger(action.data.compressedSize)) {
          throw errors.createError({
            title: `Invalid image compressed size: ${action.data.compressedSize}`
          })
        }
      }

      if (action.data.url && !_.isString(action.data.url)) {
        throw errors.createError({
          title: `Invalid image url: ${action.data.url}`
        })
      }

      if (action.data.name && !_.isString(action.data.name)) {
        throw errors.createError({
          title: `Invalid image name: ${action.data.name}`
        })
      }

      if (action.data.logo && !_.isString(action.data.logo)) {
        throw errors.createError({
          title: `Invalid image logo: ${action.data.logo}`
        })
      }

      const selectedDevices = state.getIn([ 'selection', 'devices' ])

      // Remove image-incompatible drives from selection with `constraints.isDriveValid`
      return _.reduce(selectedDevices.toJS(), (accState, device) => {
        const drive = _.find(getAvailableDrives(state), { device })
        if (!constraints.isDriveValid(drive, action.data) || !constraints.isDriveSizeRecommended(drive, action.data)) {
          return storeReducer(accState, {
            type: ACTIONS.DESELECT_DRIVE,
            data: device
          })
        }

        return accState
      }, state).setIn([ 'selection', 'image' ], Immutable.fromJS(action.data))
    }

    case ACTIONS.DESELECT_DRIVE: {
      // Type: action.data : String

      if (!action.data) {
        throw errors.createError({
          title: 'Missing drive'
        })
      }

      if (!_.isString(action.data)) {
        throw errors.createError({
          title: `Invalid drive: ${action.data}`
        })
      }

      const selectedDevices = state.getIn([ 'selection', 'devices' ])

      // Remove drive from set in state
      return state.setIn([ 'selection', 'devices' ], selectedDevices.delete(action.data))
    }

    case ACTIONS.DESELECT_IMAGE: {
      return state.deleteIn([ 'selection', 'image' ])
    }

    case ACTIONS.SET_APPLICATION_SESSION_UUID: {
      return state.set('applicationSessionUuid', action.data)
    }

    case ACTIONS.SET_FLASHING_WORKFLOW_UUID: {
      return state.set('flashingWorkflowUuid', action.data)
    }

    default: {
      return state
    }
  }
}

module.exports = _.merge(redux.createStore(storeReducer, DEFAULT_STATE), {
  Actions: ACTIONS,
  Defaults: DEFAULT_STATE
})

/**
 * @summary Observe the store for changes
 * @param {Function} onChange - change handler
 * @returns {Function} unsubscribe
 * @example
 * store.observe((newState) => {
 *   // ...
 * })
 */
module.exports.observe = (onChange) => {
  let currentState = null

  /**
   * @summary Internal change detection handler
   * @private
   * @example
   * store.subscribe(changeHandler)
   */
  const changeHandler = () => {
    const nextState = module.exports.getState()
    if (!_.isEqual(nextState, currentState)) {
      currentState = nextState
      onChange(currentState)
    }
  }

  changeHandler()

  return module.exports.subscribe(changeHandler)
}
