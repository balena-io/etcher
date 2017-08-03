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

const path = require('path')
const bindings = require('bindings')

/**
 * @summary Load a native module
 * @function
 * @public
 *
 * @param {String} moduleName - native module name
 * @returns {Object} native module
 *
 * @example
 * const elevator = nativeModule.load('elevator');
 */
exports.load = (moduleName) => {
  return bindings({
    bindings: moduleName,

  /* eslint-disable camelcase */

    module_root: path.join(__dirname, '..', '..')

  /* eslint-enable camelcase */

  })
}
