/*
 * Copyright 2016 Resin.io
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

/**
 * @summary Application default state
 * @type Object
 * @constant
 * @private
 */
const DEFAULT_STATE = Immutable.fromJS({
  availableDrives: [],
  selection: {},
  flash: {
    flashing: false,
    state: {
      progress: 0,
      speed: 0
    }
  }
});

/**
 * @summary Application supported action messages
 * @type Object
 * @constant
 */
const ACTIONS = _.fromPairs(_.map([
  'SET_AVAILABLE_DRIVES',
  'SET_FLASH_STATE',
  'RESET_FLASH_STATE',
  'SET_FLASHING',
  'SELECT_DRIVE',
  'SELECT_IMAGE',
  'REMOVE_DRIVE',
  'REMOVE_IMAGE'
], function(message) {
  return [ message, message ];
}));

const storeReducer = function(state, action) {
  state = state || DEFAULT_STATE;

  switch (action.type) {

    case ACTIONS.SET_AVAILABLE_DRIVES: {
      if (!action.data) {
        throw new Error('Missing drives');
      }

      if (!_.isArray(action.data) || !_.every(action.data, _.isPlainObject)) {
        throw new Error(`Invalid drives: ${action.data}`);
      }

      const newState = state.set('availableDrives', Immutable.fromJS(action.data));

      // Notice we only autoselect the drive if there is an image,
      // which means that the first step was completed successfully,
      // otherwise the drive is selected while the drive step is disabled
      // which looks very weird.
      if (action.data.length === 1 && state.hasIn([ 'selection', 'image' ])) {

        const drive = _.first(action.data);

        // TODO: Reuse from SelectionStateModel.isDriveValid()
        if (state.getIn([ 'selection', 'image', 'size' ], 0) <= drive.size && !drive.protected) {
          return storeReducer(newState, {
            type: ACTIONS.SELECT_DRIVE,
            data: drive
          });
        }

      }

      const selectedDevice = state.getIn([ 'selection', 'drive', 'device' ]);

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
      if (!state.getIn([ 'flash', 'flashing' ])) {
        throw new Error('Can\'t set the flashing state when not flashing');
      }

      return state.setIn([ 'flash', 'state' ], Immutable.fromJS(action.data));
    }

    case ACTIONS.RESET_FLASH_STATE: {
      return state.setIn([ 'flash', 'state' ], DEFAULT_STATE.getIn([ 'flash', 'state' ]));
    }

    case ACTIONS.SET_FLASHING: {
      const value = Boolean(action.data);
      const newState = state.setIn([ 'flash', 'flashing' ], value);

      if (!value) {
        return storeReducer(newState, {
          type: ACTIONS.RESET_FLASH_STATE
        });
      }

      return newState;
    }

    case ACTIONS.SELECT_DRIVE: {
      if (!action.data.device) {
        throw new Error('Missing drive device');
      }

      if (!_.isString(action.data.device)) {
        throw new Error(`Invalid drive device: ${action.data.device}`);
      }

      if (!action.data.name) {
        throw new Error('Missing drive name');
      }

      if (!_.isString(action.data.name)) {
        throw new Error(`Invalid drive name: ${action.data.name}`);
      }

      if (!action.data.size) {
        throw new Error('Missing drive size');
      }

      if (!_.isNumber(action.data.size)) {
        throw new Error(`Invalid drive size: ${action.data.size}`);
      }

      if (!_.isBoolean(action.data.protected)) {
        throw new Error(`Invalid drive protected state: ${action.data.protected}`);
      }

      if (action.data.protected) {
        throw new Error('The drive is write-protected');
      }

      // TODO: Reuse from SelectionStateModel.isDriveLargeEnough()
      if (state.getIn([ 'selection', 'image', 'size' ], 0) > action.data.size) {
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

      return state.setIn([ 'selection', 'image' ], Immutable.fromJS(action.data));
    }

    case ACTIONS.REMOVE_DRIVE: {
      return state.deleteIn([ 'selection', 'drive' ]);
    }

    case ACTIONS.REMOVE_IMAGE: {
      return state.deleteIn([ 'selection', 'image' ]);
    }

    default: {
      return state;
    }

  }
};

module.exports = _.merge(redux.createStore(storeReducer), {
  Actions: ACTIONS
});
