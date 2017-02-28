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
const persistState = require('redux-localstorage');
const constraints = require('../../shared/drive-constraints');

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
    sleepUpdateCheck: false,
    lastUpdateNotify: null
  }
});

/**
 * @summary State path to be persisted
 * @type {Object}
 * @constant
 * @private
 */
const PERSISTED_PATH = 'settings';

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
  'SET_SETTING'
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
      if (!action.data) {
        throw new Error('Missing drives');
      }

      if (!_.isArray(action.data) || !_.every(action.data, _.isPlainObject)) {
        throw new Error(`Invalid drives: ${action.data}`);
      }

      const newState = state.set('availableDrives', Immutable.fromJS(action.data));

      const AUTOSELECT_DRIVE_COUNT = 1;
      const numberOfDrives = action.data.length;
      if (numberOfDrives === AUTOSELECT_DRIVE_COUNT) {

        const drive = _.first(action.data);

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
            data: drive.device
          });
        }

      }

      const selectedDevice = newState.getIn([ 'selection', 'drive' ]);

      if (selectedDevice && !_.find(action.data, {
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
        throw new Error('Can\'t set the flashing state when not flashing');
      }

      if (!action.data.type) {
        throw new Error('Missing state type');
      }

      if (!_.isString(action.data.type)) {
        throw new Error(`Invalid state type: ${action.data.type}`);
      }

      if (_.isNil(action.data.percentage)) {
        throw new Error('Missing state percentage');
      }

      if (!_.isNumber(action.data.percentage)) {
        throw new Error(`Invalid state percentage: ${action.data.percentage}`);
      }

      if (_.isNil(action.data.eta)) {
        throw new Error('Missing state eta');
      }

      if (!_.isNumber(action.data.eta)) {
        throw new Error(`Invalid state eta: ${action.data.eta}`);
      }

      if (_.isNil(action.data.speed)) {
        throw new Error('Missing state speed');
      }

      return state.set('flashState', Immutable.fromJS(action.data));
    }

    case ACTIONS.RESET_FLASH_STATE: {
      return state
        .set('flashState', DEFAULT_STATE.get('flashState'))
        .set('flashResults', DEFAULT_STATE.get('flashResults'));
    }

    case ACTIONS.SET_FLASHING_FLAG: {
      return state
        .set('isFlashing', true)
        .set('flashResults', DEFAULT_STATE.get('flashResults'));
    }

    case ACTIONS.UNSET_FLASHING_FLAG: {
      if (!action.data) {
        throw new Error('Missing results');
      }

      _.defaults(action.data, {
        cancelled: false
      });

      if (!_.isBoolean(action.data.cancelled)) {
        throw new Error(`Invalid results cancelled: ${action.data.cancelled}`);
      }

      if (action.data.cancelled && action.data.sourceChecksum) {
        throw new Error('The sourceChecksum value can\'t exist if the flashing was cancelled');
      }

      if (action.data.sourceChecksum && !_.isString(action.data.sourceChecksum)) {
        throw new Error(`Invalid results sourceChecksum: ${action.data.sourceChecksum}`);
      }

      if (action.data.errorCode && !_.isString(action.data.errorCode) && !_.isNumber(action.data.errorCode)) {
        throw new Error(`Invalid results errorCode: ${action.data.errorCode}`);
      }

      return state
        .set('isFlashing', false)
        .set('flashResults', Immutable.fromJS(action.data))
        .set('flashState', DEFAULT_STATE.get('flashState'));
    }

    case ACTIONS.SELECT_DRIVE: {
      if (!action.data) {
        throw new Error('Missing drive');
      }

      if (!_.isString(action.data)) {
        throw new Error(`Invalid drive: ${action.data}`);
      }

      const selectedDrive = findDrive(state, action.data);

      if (!selectedDrive) {
        throw new Error(`The drive is not available: ${action.data}`);
      }

      if (selectedDrive.get('protected')) {
        throw new Error('The drive is write-protected');
      }

      const image = state.getIn([ 'selection', 'image' ]);
      if (image && !constraints.isDriveLargeEnough(selectedDrive.toJS(), image.toJS())) {
        throw new Error('The drive is not large enough');
      }

      return state.setIn([ 'selection', 'drive' ], Immutable.fromJS(action.data));
    }

    case ACTIONS.SELECT_IMAGE: {
      if (!action.data.path) {
        throw new Error('Missing image path');
      }

      if (!_.isString(action.data.path)) {
        throw new Error(`Invalid image path: ${action.data.path}`);
      }

      if (!action.data.size) {
        throw new Error('Missing image size');
      }

      if (!_.isNumber(action.data.size)) {
        throw new Error(`Invalid image size: ${action.data.size}`);
      }

      if (action.data.url && !_.isString(action.data.url)) {
        throw new Error(`Invalid image url: ${action.data.url}`);
      }

      if (action.data.name && !_.isString(action.data.name)) {
        throw new Error(`Invalid image name: ${action.data.name}`);
      }

      if (action.data.logo && !_.isString(action.data.logo)) {
        throw new Error(`Invalid image logo: ${action.data.logo}`);
      }

      const selectedDrive = findDrive(state, state.getIn([ 'selection', 'drive' ]));

      return _.attempt(() => {
        if (selectedDrive && !_.every([
          constraints.isDriveValid(selectedDrive.toJS(), action.data),
          constraints.isDriveSizeRecommended(selectedDrive.toJS(), action.data)
        ])) {
          return storeReducer(state, {
            type: ACTIONS.REMOVE_DRIVE
          });
        }

        return state;
      }).setIn([ 'selection', 'image' ], Immutable.fromJS(action.data));
    }

    case ACTIONS.REMOVE_DRIVE: {
      return state.deleteIn([ 'selection', 'drive' ]);
    }

    case ACTIONS.REMOVE_IMAGE: {
      return state.deleteIn([ 'selection', 'image' ]);
    }

    case ACTIONS.SET_SETTING: {
      const key = action.data.key;
      const value = action.data.value;

      if (!key) {
        throw new Error('Missing setting key');
      }

      if (!_.isString(key)) {
        throw new Error(`Invalid setting key: ${key}`);
      }

      if (!DEFAULT_STATE.get('settings').has(key)) {
        throw new Error(`Unsupported setting: ${key}`);
      }

      if (_.isObject(value)) {
        throw new Error(`Invalid setting value: ${value}`);
      }

      return state.setIn([ 'settings', key ], value);
    }

    default: {
      return state;
    }

  }
};

module.exports = _.merge(redux.createStore(
  storeReducer,
  DEFAULT_STATE,
  redux.compose(persistState(PERSISTED_PATH, {

    // The following options are set for the sole
    // purpose of dealing correctly with ImmutableJS
    // collections.
    // See: https://github.com/elgerlambert/redux-localstorage#immutable-data

    slicer: (key) => {
      return (state) => {
        return state.get(key);
      };
    },

    serialize: (collection) => {
      return JSON.stringify(collection.toJS());
    },

    deserialize: (data) => {
      return Immutable.fromJS(JSON.parse(data));
    },

    merge: (state, subset) => {

      // In the first run, there will be no information
      // to deserialize. In this case, we avoid merging,
      // otherwise we will be basically erasing the property
      // we aim to keep serialising the in future.
      if (!subset) {
        return state;
      }

      // Blindly setting the state to the deserialised subset
      // means that a user could manually edit `localStorage`
      // and extend the application state settings with
      // unsupported properties, since it can bypass validation.
      //
      // The alternative, which would be dispatching each
      // deserialised settins through the appropriate action
      // is not very elegant, nor performant, so we decide
      // to intentionally ignore this little flaw since
      // adding extra properties makes no damage at all.
      return state.set(PERSISTED_PATH, subset);

    }

  }))
), {
  Actions: ACTIONS,
  Defaults: DEFAULT_STATE
});
