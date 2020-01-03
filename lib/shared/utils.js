/*
 * Copyright 2017 balena.io
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

const _ = require('lodash')
const Bluebird = require('bluebird')
const request = Bluebird.promisifyAll(require('request'))
const tmp = require('tmp')

const errors = require('./errors')

/**
 * @summary Minimum percentage value
 * @constant
 * @public
 * @type {Number}
 */
exports.PERCENTAGE_MINIMUM = 0

/**
 * @summary Maximum percentage value
 * @constant
 * @public
 * @type {Number}
 */
exports.PERCENTAGE_MAXIMUM = 100

/**
 * @summary Check if a percentage is valid
 * @function
 * @public
 *
 * @param {Number} percentage - percentage
 * @returns {Boolean} whether the percentage is valid
 *
 * @example
 * if (utils.isValidPercentage(85)) {
 *   console.log('The percentage is valid');
 * }
 */
exports.isValidPercentage = (percentage) => {
  return _.every([
    _.isNumber(percentage),
    percentage >= exports.PERCENTAGE_MINIMUM,
    percentage <= exports.PERCENTAGE_MAXIMUM
  ])
}

/**
 * @summary Convert a percentage to a float
 * @function
 * @public
 *
 * @param {Number} percentage - percentage
 * @returns {Number} float percentage
 *
 * @example
 * const value = utils.percentageToFloat(50);
 * console.log(value);
 * > 0.5
 */
exports.percentageToFloat = (percentage) => {
  if (!exports.isValidPercentage(percentage)) {
    throw errors.createError({
      title: `Invalid percentage: ${percentage}`
    })
  }

  return percentage / exports.PERCENTAGE_MAXIMUM
}

/**
 * @summary Check if obj has one or many specific props
 * @function
 * @public
 *
 * @param {Object} obj - object
 * @param {Array<String>} props - properties
 *
 * @returns {Boolean}
 *
 * @example
 * const doesIt = hasProps({ foo: 'bar' }, [ 'foo' ]);
 */
exports.hasProps = (obj, props) => {
  return _.every(props, (prop) => {
    return _.has(obj, prop)
  })
}

/**
* @summary Get etcher configs stored online
* @param {String} - url where config.json is stored
*/
// eslint-disable-next-line
exports.getConfig = (configUrl) => {
  return request.getAsync(configUrl, { json: true })
    .get('body')
}

/**
 * @summary returns { path: String, cleanup: Function }
 * @function
 *
 * @param {Object} options - options
 *
 * @returns {Promise<{ path: String, cleanup: Function }>}
 *
 * @example
 * tmpFileAsync()
 *   .then({ path, cleanup } => {
 *     console.log(path)
 *     cleanup()
 *   });
 */
const tmpFileAsync = (options) => {
  return new Promise((resolve, reject) => {
    tmp.file(options, (error, path, _fd, cleanup) => {
      if (error) {
        reject(error)
      } else {
        resolve({ path, cleanup })
      }
    })
  })
}

/**
 * @summary Disposer for tmpFileAsync, calls cleanup()
 * @function
 *
 * @param {Object} options - options
 *
 * @returns {Disposer<{ path: String, cleanup: Function }>}
 *
 * @example
 * await Bluebird.using(tmpFileDisposer(), ({ path }) => {
 *   console.log(path);
 * })
 */
exports.tmpFileDisposer = (options) => {
  return Bluebird.resolve(tmpFileAsync(options))
    .disposer(({ cleanup }) => {
      cleanup()
    })
}
