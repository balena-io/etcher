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
const packageJSON = require('../../../../package.json')
const debug = require('debug')('etcher:models:settings')

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
  trim: false,
  updatesEnabled: packageJSON.updates.enabled && !_.includes([ 'rpm', 'deb' ], packageJSON.packageType),
  lastSleptUpdateNotifier: null,
  lastSleptUpdateNotifierVersion: null,
  desktopNotifications: true
}

/**
 * @summary Settings state
 * @type {Object}
 * @private
 */
let settings = _.cloneDeep(DEFAULT_SETTINGS)

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
  debug('reset')

  // TODO: Remove default settings from config file (?)
  settings = _.cloneDeep(DEFAULT_SETTINGS)
  return localSettings.writeAll(settings)
}

/**
 * @summary Extend the current settings
 * @function
 * @public
 *
 * @param {Object} value - value
 * @returns {Promise}
 *
 * @example
 * settings.assign({
 *   foo: 'bar'
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
exports.assign = (value) => {
  debug('assign', value)
  if (_.isNil(value)) {
    return Bluebird.reject(errors.createError({
      title: 'Missing settings'
    }))
  }

  if (!_.isPlainObject(value)) {
    return Bluebird.reject(errors.createError({
      title: 'Settings must be an object'
    }))
  }

  const newSettings = _.assign({}, settings, value)

  return localSettings.writeAll(newSettings)
    .then((updatedSettings) => {
      // NOTE: Only update in memory settings when successfully written
      settings = updatedSettings
    })
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
  debug('load')
  return localSettings.readAll().then((loadedSettings) => {
    return _.assign(settings, loadedSettings)
  })
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
  debug('set', key, value)
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

  const previousValue = settings[key]

  settings[key] = value

  return localSettings.writeAll(settings)
    .catch((error) => {
      // Revert to previous value if persisting settings failed
      settings[key] = previousValue
      throw error
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
 * @summary Check if setting value exists
 * @function
 * @public
 *
 * @param {String} key - setting key
 * @returns {Boolean} exists
 *
 * @example
 * const hasValue = settings.has('unmountOnSuccess');
 */
exports.has = (key) => {
  /* eslint-disable no-eq-null */
  return settings[key] != null
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
  debug('getAll')
  return _.cloneDeep(settings)
}

/**
 * @summary Get the default setting values
 * @function
 * @public
 *
 * @returns {Object} all setting values
 *
 * @example
 * const defaults = settings.getDefaults();
 * console.log(defaults.unmountOnSuccess);
 */
exports.getDefaults = () => {
  debug('getDefaults')
  return _.cloneDeep(DEFAULT_SETTINGS)
}
