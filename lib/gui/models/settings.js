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

/**
 * @module Etcher.Models.Settings
 */

const angular = require('angular');
const _ = require('lodash');
require('ngstorage');
const MODULE_NAME = 'Etcher.Models.Settings';
const SettingsModel = angular.module(MODULE_NAME, [
  'ngStorage'
]);

SettingsModel.service('SettingsModel', function($localStorage) {

  /**
   * @summary Default settings
   * @type {Object}
   * @private
   */
  const DEFAULT_SETTINGS = {
    errorReporting: true,
    unmountOnSuccess: true,
    validateWriteOnSuccess: true,
    sleepUpdateCheck: false,
    lastUpdateNotify: null
  };

  /**
   * @summary Settings data
   * @type {Object}
   * @private
   */
  const data = $localStorage.$default(DEFAULT_SETTINGS);

  /**
   * @summary Supported settings keys
   * @type {String[]}
   * @private
   */
  this.SUPPORTED_KEYS = _.keys(DEFAULT_SETTINGS);

  /**
   * @summary Set a setting value
   * @function
   * @public
   *
   * @param {String} key - setting key
   * @param {*} value - setting value
   *
   * @example
   * SettingsModel.set('unmountOnSuccess', true);
   */
  this.set = (key, value) => {
    if (!key) {
      throw new Error('Missing setting key');
    }

    if (!_.isString(key)) {
      throw new Error(`Invalid setting key: ${key}`);
    }

    if (!_.includes(this.SUPPORTED_KEYS, key)) {
      throw new Error(`Unsupported setting: ${key}`);
    }

    if (_.isObject(value)) {
      throw new Error(`Invalid setting value: ${value}`);
    }

    data[key] = value;
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
   * const value = SettingsModel.get('unmountOnSuccess');
   */
  this.get = (key) => {
    if (!key) {
      throw new Error('Missing setting key');
    }

    if (!_.isString(key)) {
      throw new Error(`Invalid setting key: ${key}`);
    }

    return data[key];
  };

  /**
   * @summary Get all setting values
   * @function
   * @public
   *
   * @returns {Object} all setting values
   *
   * @example
   * const allSettings = SettingsModel.getAll();
   * console.log(allSettings.unmountOnSuccess);
   */
  this.getAll = () => {
    return data;
  };

});

module.exports = MODULE_NAME;
