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

const Immutable = require('immutable')
const _ = require('lodash')
const redux = require('redux')
const uuidV4 = require('uuid/v4')
const constraints = require('./drive-constraints')
const supportedFormats = require('./supported-formats')
const errors = require('./errors')
const release = require('./release')
const fileExtensions = require('./file-extensions')
const utils = require('./utils')
const packageJSON = require('../../package.json')

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
  'percentage',
  'eta',
  'speed'
]

/**
 * @summary SELECT_IMAGE fields that can't be nil
 * @constant
 * @private
 */
const selectImageNoNilFields = [
  'path',
  'extension',
  'size'
]

/**
 * @summary Application default state
 * @type {Object}
 * @constant
 * @private
 */
const DEFAULT_STATE = Immutable.fromJS({
  availableDrives: [],
  selection: {
    devices: new Immutable.OrderedSet()
  },
  isFlashing: false,
  flashResults: {},
  flashState: {
    flashing: 0,
    validating: 0,
    succeeded: 0,
    failed: 0,
    percentage: 0,
    speed: 0
  },
  settings: {
    unsafeMode: false,
    errorReporting: true,
    unmountOnSuccess: true,
    validateWriteOnSuccess: true,
    updatesEnabled: packageJSON.updates.enabled && !_.includes([ 'rpm', 'deb' ], packageJSON.packageType),
    includeUnstableUpdateChannel: !release.isStableRelease(packageJSON.version),
    lastSleptUpdateNotifier: null,
    lastSleptUpdateNotifierVersion: null
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
  'SET_SETTINGS'
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

      // Convert object instances to plain objects
      const drives = JSON.parse(JSON.stringify(action.data))

      if (!_.isArray(drives) || !_.every(drives, _.isPlainObject)) {
        throw errors.createError({
          title: `Invalid drives: ${drives}`
        })
      }

      const newState = state.set('availableDrives', Immutable.fromJS(drives))

      const AUTOSELECT_DRIVE_COUNT = 1
      const numberOfDrives = drives.length
      if (numberOfDrives === AUTOSELECT_DRIVE_COUNT) {
        const [ drive ] = drives

        // Even if there's no image selected, we need to call several
        // drive/image related checks, and `{}` works fine with them
        const image = state.getIn([ 'selection', 'image' ], Immutable.fromJS({})).toJS()

        if (_.every([
          constraints.isDriveValid(drive, image),
          constraints.isDriveSizeRecommended(drive, image),

          // We don't want to auto-select large drives
          !constraints.isDriveSizeLarge(drive),

          // We don't want to auto-select system drives,
          // even when "unsafe mode" is enabled
          !constraints.isSystemDrive(drive)

        ])) {
          // Auto-select this drive
          return storeReducer(newState, {
            type: ACTIONS.SELECT_DRIVE,
            data: drive.device
          })
        }

        // Deselect this drive in case it still is selected
        return storeReducer(newState, {
          type: ACTIONS.DESELECT_DRIVE,
          data: drive.device
        })
      }

      const selectedDevices = newState.getIn([ 'selection', 'devices' ]).toJS()

      // Remove selected drives that are stale, i.e. missing from availableDrives
      return _.reduce(selectedDevices, (accState, device) => {
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
    }

    case ACTIONS.SET_FLASH_STATE: {
      // Type: action.data : FlashStateObject

      if (!state.get('isFlashing')) {
        throw errors.createError({
          title: 'Can\'t set the flashing state when not flashing'
        })
      }

      verifyNoNilFields(action.data, flashStateNoNilFields, 'flash')

      if (_.every(_.pick(action.data, [
        'flashing',
        'validating',
        'succeeded',
        'failed'
      ]), _.identity)) {
        throw errors.createError({
          title: 'Missing state quantity field(s)'
        })
      }

      if (!utils.isValidPercentage(action.data.percentage)) {
        throw errors.createError({
          title: `Invalid state percentage: ${action.data.percentage}`
        })
      }

      if (!_.isNumber(action.data.eta)) {
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

      if (_.some([
        !_.isString(action.data.extension),
        !_.includes(supportedFormats.getAllExtensions(), action.data.extension)
      ])) {
        throw errors.createError({
          title: `Invalid image extension: ${action.data.extension}`
        })
      }

      const lastImageExtension = fileExtensions.getLastFileExtension(action.data.path)

      if (lastImageExtension !== action.data.extension) {
        if (!action.data.archiveExtension) {
          throw errors.createError({
            title: 'Missing image archive extension'
          })
        }

        if (_.some([
          !_.isString(action.data.archiveExtension),
          !_.includes(supportedFormats.getAllExtensions(), action.data.archiveExtension)
        ])) {
          throw errors.createError({
            title: `Invalid image archive extension: ${action.data.archiveExtension}`
          })
        }

        if (lastImageExtension !== action.data.archiveExtension) {
          throw errors.createError({
            title: `Image archive extension mismatch: ${action.data.archiveExtension} and ${lastImageExtension}`
          })
        }
      }

      if (!_.isPlainObject(action.data.size)) {
        throw errors.createError({
          title: `Invalid image size: ${action.data.size}`
        })
      }

      const MINIMUM_IMAGE_SIZE = 0

      if (!_.isInteger(action.data.size.original) || action.data.size.original < MINIMUM_IMAGE_SIZE) {
        throw errors.createError({
          title: `Invalid original image size: ${action.data.size.original}`
        })
      }

      if (!_.isInteger(action.data.size.final.value) || action.data.size.final.value < MINIMUM_IMAGE_SIZE) {
        throw errors.createError({
          title: `Invalid final image size: ${action.data.size.final.value}`
        })
      }

      if (!_.isBoolean(action.data.size.final.estimation)) {
        throw errors.createError({
          title: `Invalid final image size estimation flag: ${action.data.size.final.estimation}`
        })
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

    case ACTIONS.SET_SETTINGS: {
      // Type: action.data : SettingsObject

      if (!action.data) {
        throw errors.createError({
          title: 'Missing settings'
        })
      }

      if (!_.isPlainObject(action.data)) {
        throw errors.createError({
          title: `Invalid settings: ${action.data}`
        })
      }

      const invalidPair = _.find(_.toPairs(action.data), (pair) => {
        return _.isObject(_.last(pair))
      })

      if (!_.isNil(invalidPair)) {
        throw errors.createError({
          title: `Invalid setting value: ${_.last(invalidPair)} for ${_.first(invalidPair)}`
        })
      }

      return state.setIn([ 'settings' ], Immutable.fromJS(action.data))
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
