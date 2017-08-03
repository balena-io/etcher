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

const _ = require('lodash')

/**
 * @summary Split stringified object lines
 * @function
 * @public
 *
 * @description
 * This function takes special care to not consider new lines
 * inside the object properties.
 *
 * @param {String} lines - lines
 * @returns {String[]} split lines
 *
 * @example
 * const result = utils.splitObjectLines('{"foo":"bar"}\n{"hello":"Hello\nWorld"}');
 * console.log(result);
 *
 * > [ '{"foo":"bar"}', '{"hello":"Hello\nWorld"}' ]
 */
exports.splitObjectLines = (lines) => {
  return _.chain(lines)
    .split(/((?:[^\n"']|"[^"]*"|'[^']*')+)/)
    .map(_.trim)
    .reject(_.isEmpty)
    .value()
}
