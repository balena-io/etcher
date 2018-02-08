/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

const settings = require('../models/settings')
const utils = require('../../../shared/utils')

/**
 * @summary Make the progress status subtitle string
 *
 * @param {Object} state - flashing metadata
 *
 * @returns {String}
 *
 * @example
 * const status = progressStatus.fromFlashState({
 *   type: 'write',
 *   percentage: 55,
 *   speed: 2049
 * })
 *
 * console.log(status)
 * // '55% Flashing'
 */
exports.fromFlashState = (state) => {
  const isChecking = state.type === 'check'
  const shouldValidate = settings.get('validateWriteOnSuccess')
  const shouldUnmount = settings.get('unmountOnSuccess')

  if (state.percentage === utils.PERCENTAGE_MINIMUM && !state.speed) {
    if (isChecking) {
      return 'Validating...'
    }

    return 'Starting...'
  } else if (state.percentage === utils.PERCENTAGE_MAXIMUM) {
    if ((isChecking || !shouldValidate) && shouldUnmount) {
      return 'Unmounting...'
    }

    return 'Finishing...'
  } else if (state.type === 'write') {
    return `${state.percentage}% Flashing`
  } else if (state.type === 'check') {
    return `${state.percentage}% Validating`
  }

  throw new Error(`Invalid state: ${JSON.stringify(state)}`)
}
