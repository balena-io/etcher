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
 * @module Etcher.Models.Settings
 */

const Store = require('./store');

/**
 * @summary Set a setting value
 * @function
 * @public
 *
 * @param {String} key - setting key
 * @param {*} value - setting value
 *
 * @example
 * settings.set('ejectOnSuccess', true);
 */
exports.set = (key, value) => {
  Store.dispatch({
    type: Store.Actions.SET_SETTING,
    data: {
      key,
      value
    }
  });
};

/**
 * @summary Get a setting value
 * @function
 * @public
 *
 * @param {String} key - setting key
 * @returns {*} setting value
 *
 * @example
 * const value = settings.get('ejectOnSuccess');
 */
exports.get = (key) => {
  return this.getAll()[key];
};

/**
 * @summary Get all setting values
 * @function
 * @public
 *
 * @returns {Object} all setting values
 *
 * @example
 * const allSettings = settings.getAll();
 * console.log(allSettings.ejectOnSuccess);
 */
exports.getAll = () => {
  return Store.getState().get('settings').toJS();
};
