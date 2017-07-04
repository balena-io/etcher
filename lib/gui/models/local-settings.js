/*
 * Copyright 2017 resin.io
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
 * @summary Local storage settings key
 * @constant
 * @type {String}
 */
const LOCAL_STORAGE_SETTINGS_KEY = 'etcher-settings';

/**
 * @summary Read all local settings
 * @function
 * @public
 *
 * @returns {Object} local settings
 *
 * @example
 * const settings = localSettings.readAll();
 */
exports.readAll = () => {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)) || {};
};

/**
 * @summary Write local settings
 * @function
 * @public
 *
 * @param {Object} settings - settings
 *
 * @example
 * localSettings.writeAll({
 *   foo: 'bar'
 * });
 */
exports.writeAll = (settings) => {
  const INDENTATION_SPACES = 2;
  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings, null, INDENTATION_SPACES));
};

/**
 * @summary Clear the local settings
 * @function
 * @private
 *
 * @description
 * Exported for testing purposes
 *
 * @example
 * localSettings.clear();
 */
exports.clear = () => {
  localStorage.removeItem(LOCAL_STORAGE_SETTINGS_KEY);
};
