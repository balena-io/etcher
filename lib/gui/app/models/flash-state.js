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

const _ = require('lodash')
const store = require('./store')
const units = require('../../../shared/units')

/**
 * @summary Reset flash state
 * @function
 * @public
 *
 * @example
 * flashState.resetState();
 */
exports.resetState = () => {
  store.dispatch({
    type: store.Actions.RESET_FLASH_STATE
  })
}

/**
 * @summary Check if currently flashing
 * @function
 * @private
 *
 * @returns {Boolean} whether is flashing or not
 *
 * @example
 * if (flashState.isFlashing()) {
 *   console.log('We\'re currently flashing');
 * }
 */
exports.isFlashing = () => {
  return store.getState().toJS().isFlashing
}

/**
 * @summary Set the flashing flag
 * @function
 * @private
 *
 * @description
 * This function is extracted for testing purposes.
 *
 * The flag is used to signify that we're going to
 * start a flash process.
 *
 * @example
 * flashState.setFlashingFlag();
 */
exports.setFlashingFlag = () => {
  store.dispatch({
    type: store.Actions.SET_FLASHING_FLAG
  })
}

/**
 * @summary Unset the flashing flag
 * @function
 * @private
 *
 * @description
 * This function is extracted for testing purposes.
 *
 * The flag is used to signify that the write process ended.
 *
 * @param {Object} results - flash results
 *
 * @example
 * flashState.unsetFlashingFlag({
 *   cancelled: false,
 *   sourceChecksum: 'a1b45d'
 * });
 */
exports.unsetFlashingFlag = (results) => {
  store.dispatch({
    type: store.Actions.UNSET_FLASHING_FLAG,
    data: results
  })
}

/**
 * @summary Set the flashing state
 * @function
 * @private
 *
 * @description
 * This function is extracted for testing purposes.
 *
 * @param {Object} state - flashing state
 *
 * @example
 * flashState.setProgressState({
 *   type: 'write',
 *   percentage: 50,
 *   eta: 15,
 *   speed: 100000000000
 * });
 */
exports.setProgressState = (state) => {
  // Preserve only one decimal place
  const PRECISION = 1
  const data = _.assign({}, state, {
    percentage: _.isFinite(state.percentage)
      ? Math.floor(state.percentage)
      // eslint-disable-next-line no-undefined
      : undefined,

    speed: _.attempt(() => {
      if (_.isFinite(state.speed)) {
        return _.round(units.bytesToMegabytes(state.speed), PRECISION)
      }

      return null
    }),

    totalSpeed: _.attempt(() => {
      if (_.isFinite(state.totalSpeed)) {
        return _.round(units.bytesToMegabytes(state.totalSpeed), PRECISION)
      }

      return null
    })
  })

  store.dispatch({
    type: store.Actions.SET_FLASH_STATE,
    data
  })
}

/**
 * @summary Get the flash results
 * @function
 * @private
 *
 * @returns {Object} flash results
 *
 * @example
 * const results = flashState.getFlashResults();
 */
exports.getFlashResults = () => {
  return store.getState().toJS().flashResults
}

/**
 * @summary Get the current flash state
 * @function
 * @public
 *
 * @returns {Object} flash state
 *
 * @example
 * const flashState = flashState.getFlashState();
 */
exports.getFlashState = () => {
  return store.getState().get('flashState').toJS()
}

/**
 * @summary Determine if the last flash was cancelled
 * @function
 * @public
 *
 * @description
 * This function returns false if there was no last flash.
 *
 * @returns {Boolean} whether the last flash was cancelled
 *
 * @example
 * if (flashState.wasLastFlashCancelled()) {
 *   console.log('The last flash was cancelled');
 * }
 */
exports.wasLastFlashCancelled = () => {
  return _.get(exports.getFlashResults(), [ 'cancelled' ], false)
}

/**
 * @summary Get last flash source checksum
 * @function
 * @public
 *
 * @description
 * This function returns undefined if there was no last flash.
 *
 * @returns {(String|Undefined)} the last flash source checksum
 *
 * @example
 * const checksum = flashState.getLastFlashSourceChecksum();
 */
exports.getLastFlashSourceChecksum = () => {
  return exports.getFlashResults().sourceChecksum
}

/**
 * @summary Get last flash error code
 * @function
 * @public
 *
 * @description
 * This function returns undefined if there was no last flash.
 *
 * @returns {(String|Undefined)} the last flash error code
 *
 * @example
 * const errorCode = flashState.getLastFlashErrorCode();
 */
exports.getLastFlashErrorCode = () => {
  return exports.getFlashResults().errorCode
}

/**
 * @summary Get current (or last) flash uuid
 * @function
 * @public
 *
 * @description
 * This function returns undefined if no flash has been started yet.
 *
 * @returns {String} the last flash uuid
 *
 * @example
 * const uuid = flashState.getFlashUuid();
 */
exports.getFlashUuid = () => {
  return store.getState().toJS().flashUuid
}
