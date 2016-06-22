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

module.exports = redux.createStore(function(state, action) {
  state = state || DEFAULT_STATE;

  switch (action.type) {

    case 'SET_AVAILABLE_DRIVES': {
      if (!action.data) {
        throw new Error('Missing drives');
      }

      if (!_.isArray(action.data) || !_.every(action.data, _.isPlainObject)) {
        throw new Error(`Invalid drives: ${action.data}`);
      }

      return state.set('availableDrives', Immutable.fromJS(action.data));
    }

    case 'SET_FLASH_STATE': {
      return state.setIn([ 'flash', 'state' ], Immutable.fromJS(action.data));
    }

    case 'RESET_FLASH_STATE': {
      return state.setIn([ 'flash', 'state' ], DEFAULT_STATE.getIn([ 'flash', 'state' ]));
    }

    case 'SET_FLASHING': {
      return state.setIn([ 'flash', 'flashing' ], Boolean(action.data));
    }

    case 'SELECT_DRIVE': {
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

      // TODO: Reuse from SelectionStateModel.isDriveLargeEnough()
      if (state.getIn([ 'selection', 'image', 'size' ], 0) > action.data.size) {
        throw new Error('The drive is not large enough');
      }

      return state.setIn([ 'selection', 'drive' ], Immutable.fromJS(action.data));
    }

    case 'SELECT_IMAGE': {
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

    case 'REMOVE_DRIVE': {
      return state.deleteIn([ 'selection', 'drive' ]);
    }

    case 'REMOVE_IMAGE': {
      return state.deleteIn([ 'selection', 'image' ]);
    }

    default: {
      return state;
    }

  }
});
