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
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * @summary Local storage settings key
 * @constant
 * @type {String}
 */
const LOCAL_STORAGE_SETTINGS_KEY = 'etcher-settings'

/**
 * @summary Local settings filename
 * @constant
 * @type {String}
 */
const RCFILE = '.etcher.json'

/**
 * @summary Read a local .etcherrc file
 * @function
 * @public
 *
 * @param {String} filename - file path
 * @fulfil {Object} - settings
 * @returns {Promise}
 *
 * @example
 * readConfigFile('.etcherrc').then((settings) => {
 *   console.log(settings)
 * })
 */
const readConfigFile = (filename) => {
  return new Bluebird((resolve, reject) => {
    fs.readFile(filename, (error, buffer) => {
      if (error) {
        if (error.code === 'ENOENT') {
          resolve({})
        } else {
          reject(error)
        }
      } else {
        resolve(JSON.parse(buffer.toString()))
      }
    })
  })
}

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
  const homeConfigPath = process.platform === 'win32'
    ? path.join(os.userInfo().homedir, RCFILE)
    : path.join(os.userInfo().homedir, '.config', 'etcher', 'config.json')
  const workdirConfigPath = path.join(process.cwd(), RCFILE)
  const settings = {}
  return Bluebird.try(() => {
    _.merge(settings, JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)))
  }).return(readConfigFile(homeConfigPath))
    .then((homeConfig) => {
      _.merge(settings, homeConfig)
    })
    .return(readConfigFile(workdirConfigPath))
    .then((workdirConfig) => {
      _.merge(settings, workdirConfig)
    })
    .return(settings)
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
