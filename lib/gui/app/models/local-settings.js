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

'use strict'

const Bluebird = require('bluebird')

/**
 * @summary Local storage settings key
 * @constant
 * @type {String}
 */
const LOCAL_STORAGE_SETTINGS_KEY = 'etcher-settings'

/**
 * @summary Read all local settings
 * @function
 * @public
 *
 * @fulfil {Object} - local settings
 * @returns {Promise}
 *
 * @example
 * localSettings.readAll().then((settings) => {
 *   console.log(settings);
 * });
 */
exports.readAll = () => {
  return Bluebird.try(() => {
    return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)) || {}
  })
}

/**
 * @summary Write local settings
 * @function
 * @public
 *
 * @param {Object} settings - settings
 * @returns {Promise}
 *
 * @example
 * localSettings.writeAll({
 *   foo: 'bar'
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.writeAll = (settings) => {
  const INDENTATION_SPACES = 2
  return Bluebird.try(() => {
    window.localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings, null, INDENTATION_SPACES))
  })
}

/**
 * @summary Clear the local settings
 * @function
 * @private
 *
 * @description
 * Exported for testing purposes
 *
 * @returns {Promise}
 *
 * @example
 * localSettings.clear().then(() => {
 *   console.log('Done!');
 * });
 */
exports.clear = () => {
  return Bluebird.try(() => {
    window.localStorage.removeItem(LOCAL_STORAGE_SETTINGS_KEY)
  })
}
