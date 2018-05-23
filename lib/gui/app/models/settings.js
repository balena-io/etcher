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

'use strict'

/**
 * @module Etcher.Models.Settings
 */

const _ = require('lodash')
const Bluebird = require('bluebird')
const localSettings = require('./local-settings')
const errors = require('../../../shared/errors')
const release = require('../../../shared/release')
const packageJSON = require('../../../../package.json')

/**
 * @summary Default settings
 * @constant
 * @type {Object}
 */
const DEFAULT_SETTINGS = {
  unsafeMode: false,
  errorReporting: true,
  unmountOnSuccess: true,
  validateWriteOnSuccess: true,
  updatesEnabled: packageJSON.updates.enabled && !_.includes([ 'rpm', 'deb' ], packageJSON.packageType),
  includeUnstableUpdateChannel: !release.isStableRelease(packageJSON.version),
  lastSleptUpdateNotifier: null,
  lastSleptUpdateNotifierVersion: null,
  desktopNotifications: true
}

/**
 * @summary Settings state
 * @type {Object}
 */
const settings = _.assign({}, DEFAULT_SETTINGS)

/**
 * @summary Reset settings to their default values
 * @function
 * @public
 *
 * @returns {Promise}
 *
 * @example
 * settings.reset().then(() => {
 *   console.log('Done!');
 * });
 */
exports.reset = () => {
  // TODO: Remove default settings from config file (?)
  return exports.assign(DEFAULT_SETTINGS)
}

/**
 * @summary Extend the current settings
 * @function
 * @public
 *
 * @param {Object} settings - settings
 * @returns {Promise}
 *
 * @example
 * settings.assign({
 *   foo: 'bar'
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.assign = (data) => {
  if (_.isNil(data)) {
    return Bluebird.reject(errors.createError({
      title: 'Missing settings'
    }))
  }

  return localSettings.writeAll(_.assign(exports.getAll(), data))
}

/**
 * @summary Extend the application state with the local settings
 * @function
 * @public
 *
 * @returns {Promise}
 *
 * @example
 * settings.load().then(() => {
 *   console.log('Done!');
 * });
 */
exports.load = () => {
  return localSettings.readAll().then(exports.assign)
}

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
    }))
  }

  if (!_.isString(key)) {
    return Bluebird.reject(errors.createError({
      title: `Invalid setting key: ${key}`
    }))
  }

  return exports.assign({
    [key]: value
  })
}

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
  return _.cloneDeep(_.get(settings, [ key ]))
}

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
  return _.cloneDeep(settings)
}
