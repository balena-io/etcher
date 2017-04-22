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
const resinCorvus = require('resin-corvus');
const packageJSON = require('../../package.json');

resinCorvus.install({
  services: {
    sentry: _.get(packageJSON, [ 'analytics', 'sentry', 'token' ]),
    mixpanel: _.get(packageJSON, [ 'analytics', 'mixpanel', 'token' ])
  },
  options: {
    release: packageJSON.version
  }
});

module.exports = {

  /**
   * @summary Log a debug message
   * @function
   * @public
   *
   * @description
   * This function sends the debug message to error reporting services.
   *
   * @param {String} message - message
   *
   * @example
   * analytics.log('Hello World');
   */
  logDebug: resinCorvus.logDebug,

  /**
   * @summary Log an event
   * @function
   * @public
   *
   * @description
   * This function sends the debug message to product analytics services.
   *
   * @param {String} message - message
   * @param {Object} [data] - event data
   *
   * @example
   * analytics.logEvent('Select image', {
   *   image: '/dev/disk2'
   * });
   */
  logEvent: resinCorvus.logEvent,

  /**
   * @summary Log an exception
   * @function
   * @public
   *
   * @description
   * This function logs an exception to error reporting services.
   *
   * @param {Error} exception - exception
   *
   * @example
   * analytics.logException(new Error('Something happened'));
   */
  logException: resinCorvus.logException,

  /**
   * @summary Enable analytics
   * @function
   * @public
   *
   * @example
   * analytics.enable()
   */
  enable: resinCorvus.enable,

  /**
   * @summary Disable analytics
   * @function
   * @public
   *
   * @example
   * analytics.disable()
   */
  disable: resinCorvus.disable,

  /**
   * @summary Disable analytics console output
   * @function
   * @public
   *
   * @example
   * analytics.disableConsoleOutput()
   */
  disableConsoleOutput: resinCorvus.disableConsoleOutput,

  /**
   * @summary Enable analytics console output
   * @function
   * @public
   *
   * @example
   * analytics.enableConsoleOutput()
   */
  enableConsoleOutput: resinCorvus.enableConsoleOutput
};
