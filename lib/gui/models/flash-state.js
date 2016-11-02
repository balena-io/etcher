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

/**
 * @module Etcher.Models.FlashState
 */

const angular = require('angular');
const _ = require('lodash');
const Store = require('./store');
const MODULE_NAME = 'Etcher.Models.FlashState';
const FlashState = angular.module(MODULE_NAME, []);

FlashState.service('FlashStateModel', function() {

  /**
   * @summary Reset flash state
   * @function
   * @public
   *
   * @example
   * FlashStateModel.resetState();
   */
  this.resetState = () => {
    Store.dispatch({
      type: Store.Actions.RESET_FLASH_STATE
    });
  };

  /**
   * @summary Check if currently flashing
   * @function
   * @private
   *
   * @returns {Boolean} whether is flashing or not
   *
   * @example
   * if (FlashStateModel.isFlashing()) {
   *   console.log('We\'re currently flashing');
   * }
   */
  this.isFlashing = () => {
    return Store.getState().toJS().isFlashing;
  };

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
   * FlashStateModel.setFlashingFlag();
   */
  this.setFlashingFlag = () => {
    Store.dispatch({
      type: Store.Actions.SET_FLASHING_FLAG
    });
  };

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
   * FlashStateModel.unsetFlashingFlag({
   *   cancelled: false,
   *   sourceChecksum: 'a1b45d'
   * });
   */
  this.unsetFlashingFlag = (results) => {
    Store.dispatch({
      type: Store.Actions.UNSET_FLASHING_FLAG,
      data: results
    });
  };

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
   * FlashStateModel.setProgressState({
   *   type: 'write',
   *   percentage: 50,
   *   eta: 15,
   *   speed: 100000000000
   * });
   */
  this.setProgressState = (state) => {
    Store.dispatch({
      type: Store.Actions.SET_FLASH_STATE,
      data: {
        type: state.type,
        percentage: state.percentage,
        eta: state.eta,

        speed: _.attempt(() => {
          if (_.isNumber(state.speed) && !_.isNaN(state.speed)) {

            // Transform bytes to megabytes preserving only two decimal places
            return Math.floor(state.speed / 1e+6 * 100) / 100;

          }
        })
      }
    });
  };

  /**
   * @summary Get the flash results
   * @function
   * @private
   *
   * @returns {Object} flash results
   *
   * @example
   * const results = FlashStateModel.getFlashResults();
   */
  this.getFlashResults = () => {
    return Store.getState().toJS().flashResults;
  };

  /**
   * @summary Get the current flash state
   * @function
   * @public
   *
   * @returns {Object} flash state
   *
   * @example
   * const flashState = FlashStateModel.getFlashState();
   */
  this.getFlashState = () => {
    return Store.getState().get('flashState').toJS();
  };

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
   * if (FlashStateModel.wasLastFlashCancelled()) {
   *   console.log('The last flash was cancelled');
   * }
   */
  this.wasLastFlashCancelled = () => {
    return _.get(this.getFlashResults(), 'cancelled', false);
  };

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
   * const checksum = FlashStateModel.getLastFlashSourceChecksum();
   */
  this.getLastFlashSourceChecksum = () => {
    return this.getFlashResults().sourceChecksum;
  };

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
   * const errorCode = FlashStateModel.getLastFlashErrorCode();
   */
  this.getLastFlashErrorCode = () => {
    return this.getFlashResults().errorCode;
  };

});

module.exports = MODULE_NAME;
