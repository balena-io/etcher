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

const _ = require('lodash');
const errors = require('./errors');

/**
 * @summary Minimum percentage value
 * @constant
 * @private
 * @type {Number}
 */
const PERCENTAGE_MINIMUM = 0;

/**
 * @summary Maximum percentage value
 * @constant
 * @private
 * @type {Number}
 */
const PERCENTAGE_MAXIMUM = 100;

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
    percentage >= PERCENTAGE_MINIMUM,
    percentage <= PERCENTAGE_MAXIMUM
  ]);
};

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
    });
  }

  return percentage / PERCENTAGE_MAXIMUM;
};
