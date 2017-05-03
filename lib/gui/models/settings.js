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

const _ = require('lodash');
const Bluebird = require('bluebird');
const Store = require('./store');
const errors = require('../../shared/errors');
const settings = require('../../shared/settings');

/**
 * @summary Get a setting value
 * @function
 * @public
 *
 * @param {String} key - setting key
 * @returns {*} setting value
 *
 * @example
 * const value = settings.get('unmountOnSuccess');
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
 * console.log(allSettings.unmountOnSuccess);
 */
exports.getAll = () => {
  return Store.getState().get('settings').toJS();
};

exports.setAll = (object) => {
  return settings.writeAll(settings.getConfigurationFilePath(), object).then(() => {
    Store.dispatch({
      type: Store.Actions.SET_SETTINGS,
      data: object
    });
  });
};

/**
 * @summary Set a setting value
 * @function
 * @public
 *
 * @param {String} key - setting key
 * @param {*} value - setting value
 * @returns {Promise}
 *
 * @example
 * settings.set('unmountOnSuccess', true).then(() => {
 *   console.log('Done!');
 * });
 */
exports.set = (key, value) => {
  if (_.isNil(key)) {
    return Bluebird.reject(errors.createError({
      title: 'Missing setting key'
    }));
  }

  if (!_.isString(key)) {
    return Bluebird.reject(errors.createError({
      title: `Invalid setting key: ${key}`
    }));
  }

  const newSettings = _.merge(exports.getAll(), _.fromPairs([
    [ key, value ]
  ]));

  return exports.setAll(newSettings);
};
