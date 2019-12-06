/*
 * Copyright 2018 balena.io
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

const INDENTATION_SPACES = 2

/**
 * @summary Localstorage class and helper functions
 * @class
 * @public
 */
class Storage {
  /**
   * @function
   * @public
   *
   * @param {String} superkey - superkey
   *
   * @example
   * const potatoStorage = new Storage('potato')
   */
  constructor (superkey) {
    this.superkey = superkey
  }

  /**
   * @summary Get the whole object under the superkey
   * @function
   * @public
   *
   * @returns {Object}
   *
   * @example
   * for (const key in potatoStorage.getAll()) {
   *   console.log(key)
   * }
   */
  getAll () {
    try {
      // JSON.parse(null) === null, so we fallback to {}
      return JSON.parse(window.localStorage.getItem(this.superkey)) || {}
    } catch (err) {
      this.setAll({})
      throw err
    }
  }

  /**
   * @summary Set the whole object under the superkey
   * @function
   * @public
   *
   * @param {Any} value - any valid JSON value
   *
   * @example
   * potatoStorage.setAll({
   *   location: 'somewhere',
   *   freshness: 100,
   *   edible: true
   * })
   */
  setAll (value) {
    window.localStorage.setItem(this.superkey, JSON.stringify(value, null, INDENTATION_SPACES))
  }

  /**
   * @summary Clear the whole object under the superkey
   * @function
   * @public
   *
   * @example
   * potatoStorage.clearAll()
   */
  clearAll () {
    window.localStorage.removeItem(this.superkey)
  }

  /**
   * @summary Get a stored value
   * @function
   * @public
   *
   * @param {String} key - object field key
   * @param {Any} defaultValue - any valid JSON value
   * @returns {Any} - the JSON parsed value
   *
   * @example
   * potatoStorage.get('location', 'my farm')
   */
  get (key, defaultValue) {
    const value = this.getAll()[key]

    // eslint-disable-next-line no-undefined
    if (value === undefined) {
      return defaultValue
    }

    return value
  }

  /**
   * @summary Modify a stored value
   * @function
   * @public
   *
   * @param {String} key - object field key
   * @param {Function} func - function to apply to the value
   * @param {Any} defaultValue - fallback value
   * @returns {Any} - the value returned by the function applied above
   *
   * @example
   * potatoStorage.modify('freshness', (freshness) => {
   *   return freshness + 1
   * })
   */
  modify (key, func, defaultValue) {
    const obj = this.getAll()

    let result = null
    // eslint-disable-next-line no-undefined
    if (obj[key] === undefined) {
      result = func(defaultValue)
    } else {
      result = func(obj[key])
    }

    // eslint-disable-next-line lodash/prefer-lodash-method
    this.setAll(Object.assign(obj, { [key]: result }))
    return result
  }

  /**
   * @summary Set a stored value
   * @function
   * @public
   *
   * @param {String} key - object field key
   * @param {Any} value - value to set
   *
   * @example
   * potatoStorage.set('edible', true)
   */
  set (key, value) {
    this.modify(key, () => {
      return value
    })
  }
}

module.exports = Storage
