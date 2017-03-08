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

'use strict';

const _ = require('lodash');
const chalk = require('chalk');

/**
 * @summary Human-friendly error messages
 * @namespace HUMAN_FRIENDLY
 * @public
 */
exports.HUMAN_FRIENDLY = {

  /* eslint-disable new-cap */

  /**
   * @property {Function} ENOENT
   * @memberof HUMAN_FRIENDLY
   * @param {Error} error - error object
   * @returns {String} message
   */
  ENOENT: (error) => {
    return `No such file or directory: ${error.path}`;
  },

  /**
   * @property {Function} EPERM
   * @memberof HUMAN_FRIENDLY
   * @returns {String} message
   */
  EPERM: () => {
    return 'You\'re not authorized to perform this operation';
  },

  /**
   * @property {Function} EACCES
   * @memberof HUMAN_FRIENDLY
   * @returns {String} message
   */
  EACCES: () => {
    return 'You\'re don\'t have access to this resource';
  }

  /* eslint-enable new-cap */

};

/**
 * @summary Get default error message
 * @function
 * @private
 *
 * @param {Error} error - error
 * @returns {String} error message
 *
 * @example
 * const message = defaultMessageGetter(new Error('foo bar'));
 * console.log(message);
 * > 'foo bar'
 *
 * @example
 * const message = defaultMessageGetter(new Error());
 * console.log(message);
 * > 'Unknown error'
 */
const defaultMessageGetter = (error) => {
  return error.message || 'Unknown error';
};

/**
 * @summary Get error message
 * @function
 * @public
 *
 * @param {(String|Error)} error - error
 * @returns {String} error message
 *
 * @example
 * const error = new Error('Foo bar');
 * error.description = 'This is a fake error';
 *
 * console.log(errors.getErrorMessage(error));
 * > 'Foo bar\n\nThis is a fake error'
 */
exports.getErrorMessage = (error) => {
  if (_.isString(error)) {
    return exports.getErrorMessage(new Error(error));
  }

  const message = _.attempt(() => {
    const title = _.get(exports.HUMAN_FRIENDLY, error.code, defaultMessageGetter)(error);
    return error.code ? `${error.code}: ${title}` : title;
  });

  if (error.description) {
    return `${message}\n\n${error.description}`;
  }

  return message;
};

/**
 * @summary Print an error to stderr
 * @function
 * @public
 *
 * @param {(Error|String)} error - error
 *
 * @example
 * errors.print(new Error('Oops!'));
 */
exports.print = (error) => {
  const message = exports.getErrorMessage(error);
  console.error(chalk.red(message));
};
