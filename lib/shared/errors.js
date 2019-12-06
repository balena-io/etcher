/*
 * Copyright 2016 balena.io
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
 * @summary Create an error details object
 * @function
 * @private
 *
 * @param {Object} options - options
 * @param {(String|Function)} options.title - error title
 * @param {(String|Function)} options.description - error description
 * @returns {Object} error details object
 *
 * @example
 * const details = createErrorDetails({
 *   title: (error) => {
 *     return `An error happened, the code is ${error.code}`;
 *   },
 *   description: 'This is the error description'
 * });
 */
const createErrorDetails = (options) => {
  return _.pick(_.mapValues(options, (value) => {
    return _.isFunction(value) ? value : _.constant(value)
  }), [ 'title', 'description' ])
}

/**
 * @summary Human-friendly error messages
 * @namespace HUMAN_FRIENDLY
 * @public
 */
exports.HUMAN_FRIENDLY = {

  /* eslint-disable new-cap */

  /**
   * @namespace ENOENT
   * @memberof HUMAN_FRIENDLY
   */
  ENOENT: createErrorDetails({
    title: (error) => {
      return `No such file or directory: ${error.path}`
    },
    description: 'The file you\'re trying to access doesn\'t exist'
  }),

  /**
   * @namespace EPERM
   * @memberof HUMAN_FRIENDLY
   */
  EPERM: createErrorDetails({
    title: 'You\'re not authorized to perform this operation',
    description: 'Please ensure you have necessary permissions for this task'
  }),

  /**
   * @namespace EACCES
   * @memberof HUMAN_FRIENDLY
   */
  EACCES: createErrorDetails({
    title: 'You don\'t have access to this resource',
    description: 'Please ensure you have necessary permissions to access this resource'
  }),

  /**
   * @namespace ENOMEM
   * @memberof HUMAN_FRIENDLY
   */
  ENOMEM: createErrorDetails({
    title: 'Your system ran out of memory',
    description: 'Please make sure your system has enough available memory for this task'
  })

  /* eslint-enable new-cap */

}

/**
 * @summary Get user friendly property from an error
 * @function
 * @private
 *
 * @param {Error} error - error
 * @param {String} property - HUMAN_FRIENDLY property
 * @returns {(String|Undefined)} user friendly message
 *
 * @example
 * const error = new Error('My error');
 * error.code = 'ENOMEM';
 *
 * const friendlyDescription = getUserFriendlyMessageProperty(error, 'description');
 *
 * if (friendlyDescription) {
 *   console.log(friendlyDescription);
 * }
 */
const getUserFriendlyMessageProperty = (error, property) => {
  const code = _.get(error, [ 'code' ])

  if (_.isNil(code) || !_.isString(code)) {
    return null
  }

  return _.invoke(exports.HUMAN_FRIENDLY, [ code, property ], error)
}

/**
 * @summary Check if a string is blank
 * @function
 * @private
 *
 * @param {String} string - string
 * @returns {Boolean} whether the string is blank
 *
 * @example
 * if (isBlank('   ')) {
 *   console.log('The string is blank');
 * }
 */
const isBlank = _.flow([ _.trim, _.isEmpty ])

/**
 * @summary Get the title of an error
 * @function
 * @public
 *
 * @description
 * Try to get as much information as possible about the error
 * rather than falling back to generic messages right away.
 *
 * @param {Error} error - error
 * @returns {String} error title
 *
 * @example
 * const error = new Error('Foo bar');
 * const title = errors.getTitle(error);
 * console.log(title);
 */
exports.getTitle = (error) => {
  if (!_.isError(error) && !_.isPlainObject(error) && !_.isNil(error)) {
    return _.toString(error)
  }

  const codeTitle = getUserFriendlyMessageProperty(error, 'title')
  if (!_.isNil(codeTitle)) {
    return codeTitle
  }

  const message = _.get(error, [ 'message' ])
  if (!isBlank(message)) {
    return message
  }

  const code = _.get(error, [ 'code' ])
  if (!_.isNil(code) && !isBlank(code)) {
    return `Error code: ${code}`
  }

  return 'An error ocurred'
}

/**
 * @summary Get the description of an error
 * @function
 * @public
 *
 * @param {Error} error - error
 * @param {Object} options - options
 * @param {Boolean} [options.userFriendlyDescriptionsOnly=false] - only return user friendly descriptions
 * @returns {String} error description
 *
 * @example
 * const error = new Error('Foo bar');
 * const description = errors.getDescription(error);
 * console.log(description);
 */
exports.getDescription = (error, options = {}) => {
  _.defaults(options, {
    userFriendlyDescriptionsOnly: false
  })

  if (!_.isError(error) && !_.isPlainObject(error)) {
    return ''
  }

  if (!isBlank(error.description)) {
    return error.description
  }

  const codeDescription = getUserFriendlyMessageProperty(error, 'description')
  if (!_.isNil(codeDescription)) {
    return codeDescription
  }

  if (options.userFriendlyDescriptionsOnly) {
    return ''
  }

  if (error.stack) {
    return error.stack
  }

  if (_.isEmpty(error)) {
    return ''
  }

  const INDENTATION_SPACES = 2
  return JSON.stringify(error, null, INDENTATION_SPACES)
}

/**
 * @summary Create an error
 * @function
 * @public
 *
 * @param {Object} options - options
 * @param {String} options.title - error title
 * @param {String} [options.description] - error description
 * @param {Boolean} [options.report] - report error
 * @returns {Error} error
 *
 * @example
 * const error = errors.createError({
 *   title: 'Foo'
 *   description: 'Bar'
 * });
 *
 * throw error;
 */
exports.createError = (options) => {
  if (isBlank(options.title)) {
    throw new Error(`Invalid error title: ${options.title}`)
  }

  const error = new Error(options.title)
  error.description = options.description

  if (!_.isNil(options.report) && !options.report) {
    error.report = false
  }

  if (!_.isNil(options.code)) {
    error.code = options.code
  }

  return error
}

/**
 * @summary Create a user error
 * @function
 * @public
 *
 * @description
 * User errors represent invalid states that the user
 * caused, that are not errors on the application itself.
 * Therefore, user errors don't get reported to analytics
 * and error reporting services.
 *
 * @param {Object} options - options
 * @param {String} options.title - error title
 * @param {String} [options.description] - error description
 * @returns {Error} user error
 *
 * @example
 * const error = errors.createUserError({
 *   title: 'Foo',
 *   description: 'Bar'
 * });
 *
 * throw error;
 */
exports.createUserError = (options) => {
  return exports.createError({
    title: options.title,
    description: options.description,
    report: false,
    code: options.code
  })
}

/**
 * @summary Check if an error is an user error
 * @function
 * @public
 *
 * @param {Error} error - error
 * @returns {Boolean} whether the error is a user error
 *
 * @example
 * const error = errors.createUserError('Foo', 'Bar');
 *
 * if (errors.isUserError(error)) {
 *   console.log('This error is a user error');
 * }
 */
exports.isUserError = (error) => {
  return _.isNil(error.report) ? false : !error.report
}

/**
 * @summary Convert an Error object to a JSON object
 * @function
 * @public
 *
 * @param {Error} error - error object
 * @returns {Object} json error
 *
 * @example
 * const error = errors.toJSON(new Error('foo'))
 *
 * console.log(error.message);
 * > 'foo'
 */
exports.toJSON = (error) => {
  // Handle string error objects to be on the safe side
  const isErrorLike = _.isError(error) || _.isPlainObject(error)
  const errorObject = isErrorLike ? error : new Error(error)

  return {
    name: errorObject.name,
    message: errorObject.message,
    description: errorObject.description,
    stack: errorObject.stack,
    report: errorObject.report,
    code: errorObject.code,
    syscall: errorObject.syscall,
    errno: errorObject.errno,
    stdout: errorObject.stdout,
    stderr: errorObject.stderr,
    device: errorObject.device
  }
}

/**
 * @summary Convert a JSON object to an Error object
 * @function
 * @public
 *
 * @param {Error} json - json object
 * @returns {Object} error object
 *
 * @example
 * const error = errors.fromJSON(errors.toJSON(new Error('foo')));
 *
 * console.log(error.message);
 * > 'foo'
 */
exports.fromJSON = (json) => {
  return _.assign(new Error(json.message), json)
}
