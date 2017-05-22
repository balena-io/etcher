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

const path = require('path');
const _ = require('lodash');
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const os = require('os');
const errors = require('./errors');
const packageJSON = require('../../package.json');

/**
 * @summary Get the file path of the application configuration file
 * @function
 * @private
 *
 * @returns {String} configuration file path
 *
 * @example
 * const configurationFilePath = settings.getConfigurationFilePath();
 */
exports.getConfigurationFilePath = () => {
  const hiddenFilePrefix = os.platform() === 'win32' ? '_' : '.';
  return path.join(os.homedir(), `${hiddenFilePrefix}${packageJSON.name}rc`);
};

/**
 * @summary Check if a setting value is invalid
 * @function
 * @private
 *
 * @description
 * Our settings implementation only supports primitive values.
 *
 * @param {*} value - settings value
 * @returns {Boolean} whether the setting value is invalid
 *
 * @example
 * if (isInvalidSettingValue([ 1, 2, 3 ])) {
 *   console.log('This setting value is invalid');
 * }
 */
const isInvalidSettingValue = _.overSome([ _.isArray, _.isObject ]);

/**
 * @summary Read all settings from a configuration file
 * @function
 * @public
 *
 * @param {String} configurationFilePath - configuration file path
 * @fulfil {Object} - settings object
 * @returns {Promise}
 *
 * @example
 * settings.readAll(settings.getConfigurationFilePath()).then((data) => {
 *   console.log(data);
 * });
 */
exports.readAll = (configurationFilePath) => {
  return fs.readFileAsync(configurationFilePath, {
    encoding: 'utf8'
  }).then((contents) => {
    if (_.isEmpty(_.trim(contents))) {
      return {};
    }

    const result = _.attempt(JSON.parse, contents);

    if (_.isError(result)) {
      throw errors.createUserError({
        title: `Invalid settings in ${configurationFilePath}`,
        description: 'Please fix or delete this file to continue'
      });
    }

    return _.omitBy(result, isInvalidSettingValue);
  }).catch((error) => {
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      throw errors.createUserError({
        title: `Can't access settings in ${configurationFilePath}`,
        description: 'Please fix or delete this file to continue'
      });
    }

    if (error.code === 'ENOENT') {
      return {};
    }

    throw error;
  });
};

/**
 * @summary Write all settings to a configuration file
 * @function
 * @public
 *
 * @description
 * Note that this function will completely override any settings
 * on the configuration file.
 *
 * @param {String} configurationFilePath - configuration file path
 * @param {Object} settings - settings object
 * @returns {Promise}
 *
 * @example
 * settings.writeAll(settings.getConfigurationFilePath(), {
 *   foo: 'bar'
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.writeAll = (configurationFilePath, settings) => {
  const invalidSettings = _.pickBy(settings, isInvalidSettingValue);
  const JSON_INDENTATION_SPACES = 2;
  const serialisedData = JSON.stringify(settings, null, JSON_INDENTATION_SPACES);

  if (!_.isString(serialisedData) || !_.isPlainObject(settings) || !_.isEmpty(invalidSettings)) {
    return Bluebird.reject(errors.createError({
      title: 'Invalid settings',
      description: serialisedData
    }));
  }

  return fs.writeFileAsync(configurationFilePath, serialisedData).catch((error) => {
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      throw errors.createUserError({
        title: `Can't access settings in ${configurationFilePath}`,
        description: 'Please fix or delete this file and try again'
      });
    }

    throw error;
  });
};
