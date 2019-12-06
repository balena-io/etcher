/*
 * Copyright 2016 Juan Cruz Viotti. https://github.com/jviotti
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

/**
 * @summary Truncate text from the middle with an ellipsis
 * @public
 * @function
 *
 * @param {String} input - input string
 * @param {Number} limit - output limit
 * @returns {String} truncated string
 *
 * @throws Will throw if `limit` < 3
 *
 * @example
 * middleEllipsis('MyVeryLongString', 5)
 * > 'My\u2026ng'
 */
module.exports = (input, limit) => {
  const MIDDLE_ELLIPSIS_CHARACTER = '\u2026'
  const MINIMUM_LENGTH = 3

  // We can't provide a 100% expected result if the limit is less than 3. For example:
  //
  // If the limit == 2:
  //   Should we display the first at last character without an ellipses in the middle?
  //   Should we display just one character and an ellipses before or after?
  //   Should we display nothing at all?
  //
  // If the limit == 1:
  //   Should we display just one character?
  //   Should we display just an ellipses?
  //   Should we display nothing at all?
  //
  // Etc.
  if (limit < MINIMUM_LENGTH) {
    throw new Error('middleEllipsis: Limit should be at least 3')
  }

  // Do nothing, the string doesn't need truncation.
  if (input.length <= limit) {
    return input
  }

  /* eslint-disable no-magic-numbers */
  const lengthOfTheSidesAfterTruncation = Math.floor((limit - 1) / 2)
  const finalLeftPart = input.slice(0, lengthOfTheSidesAfterTruncation)
  const finalRightPart = input.slice(input.length - lengthOfTheSidesAfterTruncation)
  /* eslint-enable no-magic-numbers */

  return finalLeftPart + MIDDLE_ELLIPSIS_CHARACTER + finalRightPart
}
