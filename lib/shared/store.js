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

'use strict';

const Immutable = require('immutable');
const _ = require('lodash');
const redux = require('redux');
const electronRedux = require('electron-redux');
const uuidV4 = require('uuid/v4');
const constraints = require('./drive-constraints');
const supportedFormats = require('./supported-formats');
const errors = require('./errors');
const release = require('./release');
const fileExtensions = require('./file-extensions');
const utils = require('./utils');
const packageJSON = require('../../package.json');

/**
 * @summary Application default state
 * @type {Object}
 * @constant
 * @private
 */
const DEFAULT_STATE = Immutable.fromJS({
  availableDrives: [],
  selection: {},
  isFlashing: false,
  flashResults: {},
  flashState: {
    percentage: 0,
    speed: 0
  },
  settings: {
    unsafeMode: false,
    errorReporting: true,
    unmountOnSuccess: true,
    validateWriteOnSuccess: true,
    updatesEnabled: packageJSON.updates.enabled,
    includeUnstableUpdateChannel: !release.isStableRelease(packageJSON.version),
    lastSleptUpdateNotifier: null,
    lastSleptUpdateNotifierVersion: null
  }
});

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
  'REMOVE_DRIVE',
  'REMOVE_IMAGE',
  'SET_SETTINGS'
], (message) => {
  return [ message, message ];
}));

/**
 * @summary Find a drive from the list of available drives
 * @function
 * @private
 *
 * @param {Object} state - application state
 * @param {String} device - drive device
 * @returns {(Object|Undefined)} drive
 *
 * @example
 * const drive = findDrive(state, '/dev/disk2');
 */
const findDrive = (state, device) => {

  /* eslint-disable lodash/prefer-lodash-method */

  return state.get('availableDrives').find((drive) => {
    return drive.get('device') === device;
  });

  /* eslint-enable lodash/prefer-lodash-method */

};

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
 *   type: ACTIONS.REMOVE_DRIVE
 * });
 */
const storeReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {

    case ACTIONS.SET_AVAILABLE_DRIVES: {
      if (!action.payload) {
        throw errors.createError({
          title: 'Missing drives'
        });
      }

      if (!_.isArray(action.payload) || !_.every(action.payload, _.isPlainObject)) {
        throw errors.createError({
          title: `Invalid drives: ${action.payload}`
        });
      }

      const newState = state.set('availableDrives', Immutable.fromJS(action.payload));

      const AUTOSELECT_DRIVE_COUNT = 1;
      const numberOfDrives = action.payload.length;
      if (numberOfDrives === AUTOSELECT_DRIVE_COUNT) {

        const drive = _.first(action.payload);

        // Even if there's no image selected, we need to call several
        // drive/image related checks, and `{}` works fine with them
        const image = state.getIn([ 'selection', 'image' ], Immutable.fromJS({})).toJS();

        if (_.every([
          constraints.isDriveValid(drive, image),
          constraints.isDriveSizeRecommended(drive, image),

          // We don't want to auto-select system drives,
          // even when "unsafe mode" is enabled
          !constraints.isSystemDrive(drive)

        ])) {
          return storeReducer(newState, {
            type: ACTIONS.SELECT_DRIVE,
            payload: drive.device
          });
        }

      }

      const selectedDevice = newState.getIn([ 'selection', 'drive' ]);

      if (selectedDevice && !_.find(action.payload, {
        device: selectedDevice
      })) {
        return storeReducer(newState, {
          type: ACTIONS.REMOVE_DRIVE
        });
      }

      return newState;
    }

    case ACTIONS.SET_FLASH_STATE: {
      if (!state.get('isFlashing')) {
        throw errors.createError({
          title: 'Can\'t set the flashing state when not flashing'
        });
      }

      if (!action.payload.type) {
        throw errors.createError({
          title: 'Missing state type'
        });
      }

      if (!_.isString(action.payload.type)) {
        throw errors.createError({
          title: `Invalid state type: ${action.payload.type}`
        });
      }

      if (_.isNil(action.payload.percentage)) {
        throw errors.createError({
          title: 'Missing state percentage'
        });
      }

      if (!utils.isValidPercentage(action.payload.percentage)) {
        throw errors.createError({
          title: `Invalid state percentage: ${action.payload.percentage}`
        });
      }

      if (_.isNil(action.payload.eta)) {
        throw errors.createError({
          title: 'Missing state eta'
        });
      }

      if (!_.isNumber(action.payload.eta)) {
        throw errors.createError({
          title: `Invalid state eta: ${action.payload.eta}`
        });
      }

      if (_.isNil(action.payload.speed)) {
        throw errors.createError({
          title: 'Missing state speed'
        });
      }

      return state.set('flashState', Immutable.fromJS(action.payload));
    }

    case ACTIONS.RESET_FLASH_STATE: {
      return state
        .set('isFlashing', false)
        .set('flashState', DEFAULT_STATE.get('flashState'))
        .set('flashResults', DEFAULT_STATE.get('flashResults'))
        .delete('flashUuid');
    }

    case ACTIONS.SET_FLASHING_FLAG: {
      return state
        .set('isFlashing', true)
        .set('flashUuid', uuidV4())
        .set('flashResults', DEFAULT_STATE.get('flashResults'));
    }

    case ACTIONS.UNSET_FLASHING_FLAG: {
      if (!action.payload) {
        throw errors.createError({
          title: 'Missing results'
        });
      }

      _.defaults(action.payload, {
        cancelled: false
      });

      if (!_.isBoolean(action.payload.cancelled)) {
        throw errors.createError({
          title: `Invalid results cancelled: ${action.payload.cancelled}`
        });
      }

      if (action.payload.cancelled && action.payload.sourceChecksum) {
        throw errors.createError({
          title: 'The sourceChecksum value can\'t exist if the flashing was cancelled'
        });
      }

      if (action.payload.sourceChecksum && !_.isString(action.payload.sourceChecksum)) {
        throw errors.createError({
          title: `Invalid results sourceChecksum: ${action.payload.sourceChecksum}`
        });
      }

      if (action.payload.errorCode && !_.isString(action.payload.errorCode) && !_.isNumber(action.payload.errorCode)) {
        throw errors.createError({
          title: `Invalid results errorCode: ${action.payload.errorCode}`
        });
      }

      return state
        .set('isFlashing', false)
        .set('flashResults', Immutable.fromJS(action.payload))
        .set('flashState', DEFAULT_STATE.get('flashState'));
    }

    case ACTIONS.SELECT_DRIVE: {
      if (!action.payload) {
        throw errors.createError({
          title: 'Missing drive'
        });
      }

      if (!_.isString(action.payload)) {
        throw errors.createError({
          title: `Invalid drive: ${action.payload}`
        });
      }

      const selectedDrive = findDrive(state, action.payload);

      if (!selectedDrive) {
        throw errors.createError({
          title: `The drive is not available: ${action.payload}`
        });
      }

      if (selectedDrive.get('protected')) {
        throw errors.createError({
          title: 'The drive is write-protected'
        });
      }

      const image = state.getIn([ 'selection', 'image' ]);
      if (image && !constraints.isDriveLargeEnough(selectedDrive.toJS(), image.toJS())) {
        throw errors.createError({
          title: 'The drive is not large enough'
        });
      }

      return state.setIn([ 'selection', 'drive' ], Immutable.fromJS(action.payload));
    }

    case ACTIONS.SELECT_IMAGE: {
      if (!action.payload.path) {
        throw errors.createError({
          title: 'Missing image path'
        });
      }

      if (!_.isString(action.payload.path)) {
        throw errors.createError({
          title: `Invalid image path: ${action.payload.path}`
        });
      }

      if (!action.payload.extension) {
        throw errors.createError({
          title: 'Missing image extension'
        });
      }

      if (_.some([
        !_.isString(action.payload.extension),
        !_.includes(supportedFormats.getAllExtensions(), action.payload.extension)
      ])) {
        throw errors.createError({
          title: `Invalid image extension: ${action.payload.extension}`
        });
      }

      const lastImageExtension = fileExtensions.getLastFileExtension(action.payload.path);

      if (lastImageExtension !== action.payload.extension) {
        if (!action.payload.archiveExtension) {
          throw errors.createError({
            title: 'Missing image archive extension'
          });
        }

        if (_.some([
          !_.isString(action.payload.archiveExtension),
          !_.includes(supportedFormats.getAllExtensions(), action.payload.archiveExtension)
        ])) {
          throw errors.createError({
            title: `Invalid image archive extension: ${action.payload.archiveExtension}`
          });
        }

        if (lastImageExtension !== action.payload.archiveExtension) {
          throw errors.createError({
            title: `Image archive extension mismatch: ${action.payload.archiveExtension} and ${lastImageExtension}`
          });
        }
      }

      if (!action.payload.size) {
        throw errors.createError({
          title: 'Missing image size'
        });
      }

      if (!_.isPlainObject(action.payload.size)) {
        throw errors.createError({
          title: `Invalid image size: ${action.payload.size}`
        });
      }

      const MINIMUM_IMAGE_SIZE = 0;

      if (!_.isInteger(action.payload.size.original) || action.payload.size.original < MINIMUM_IMAGE_SIZE) {
        throw errors.createError({
          title: `Invalid original image size: ${action.payload.size.original}`
        });
      }

      if (!_.isInteger(action.payload.size.final.value) || action.payload.size.final.value < MINIMUM_IMAGE_SIZE) {
        throw errors.createError({
          title: `Invalid final image size: ${action.payload.size.final.value}`
        });
      }

      if (!_.isBoolean(action.payload.size.final.estimation)) {
        throw errors.createError({
          title: `Invalid final image size estimation flag: ${action.payload.size.final.estimation}`
        });
      }

      if (action.payload.url && !_.isString(action.payload.url)) {
        throw errors.createError({
          title: `Invalid image url: ${action.payload.url}`
        });
      }

      if (action.payload.name && !_.isString(action.payload.name)) {
        throw errors.createError({
          title: `Invalid image name: ${action.payload.name}`
        });
      }

      if (action.payload.logo && !_.isString(action.payload.logo)) {
        throw errors.createError({
          title: `Invalid image logo: ${action.payload.logo}`
        });
      }

      const selectedDrive = findDrive(state, state.getIn([ 'selection', 'drive' ]));

      return _.attempt(() => {
        if (selectedDrive && !_.every([
          constraints.isDriveValid(selectedDrive.toJS(), action.payload),
          constraints.isDriveSizeRecommended(selectedDrive.toJS(), action.payload)
        ])) {
          return storeReducer(state, {
            type: ACTIONS.REMOVE_DRIVE
          });
        }

        return state;
      }).setIn([ 'selection', 'image' ], Immutable.fromJS(action.payload));
    }

    case ACTIONS.REMOVE_DRIVE: {
      return state.deleteIn([ 'selection', 'drive' ]);
    }

    case ACTIONS.REMOVE_IMAGE: {
      return state.deleteIn([ 'selection', 'image' ]);
    }

    case ACTIONS.SET_SETTINGS: {
      if (!action.payload) {
        throw errors.createError({
          title: 'Missing settings'
        });
      }

      if (!_.isPlainObject(action.payload)) {
        throw errors.createError({
          title: `Invalid settings: ${action.payload}`
        });
      }

      const invalidKey = _.find(_.keys(action.payload), (key) => {
        return !_.isString(key);
      });

      if (!_.isNil(invalidKey)) {
        throw errors.createError({
          title: `Invalid setting key: ${invalidKey}`
        });
      }

      const invalidPair = _.find(_.toPairs(action.payload), (pair) => {
        return _.isObject(_.last(pair));
      });

      if (!_.isNil(invalidPair)) {
        throw errors.createError({
          title: `Invalid setting value: ${_.last(invalidPair)} for ${_.first(invalidPair)}`
        });
      }

      return state.setIn([ 'settings' ], Immutable.fromJS(action.payload));
    }

    default: {
      return state;
    }

  }
};

const storeActionsAndDefaults = {
  Actions: ACTIONS,
  Defaults: DEFAULT_STATE
};

// We're not in Electron
if (typeof process === 'undefined') {
  console.log('PLAIN REDUX');
  module.exports = _.merge(redux.createStore(storeReducer, DEFAULT_STATE), storeActionsAndDefaults);

// We are in the renderer process of Electron
} else if (_.get(process, [ 'type' ]) === 'renderer') {
  console.log('RENDERER REDUX');
  const store = _.merge(redux.createStore(storeReducer, DEFAULT_STATE, redux.applyMiddleware(
    electronRedux.forwardToMain,
    store => next => action => {
      console.log('PREV', action);
      const result = next(action);
      console.log('NEXT', store.getState());
      return result;
    }
  )), storeActionsAndDefaults);

  electronRedux.replayActionRenderer(store);

  module.exports = store;

// We are in the main Electron process
} else if (process) {
  console.log('MAIN REDUX');
  const store = _.merge(redux.createStore(storeReducer, DEFAULT_STATE, redux.applyMiddleware(
    electronRedux.triggerAlias,
    electronRedux.forwardToRenderer
  )), storeActionsAndDefaults);

  electronRedux.replayActionMain(store);

  module.exports = store;
}
