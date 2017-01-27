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

/**
 * @summary Application messages
 * @namespace messages
 * @public
 */
module.exports = {

  /**
   * @summary Informational messages
   * @namespace info
   * @memberof messages
   */
  info: {

    flashComplete: _.template('Your flash is complete!')

  },

  /**
   * @summary Warning messages
   * @namespace warning
   * @memberof messages
   */
  warning: {

    exitWhileFlashing: _.template([
      'You are currently flashing a drive. Closing Etcher may leave',
      'your drive in an unusable state.\n\n',
      'Are you sure you want to close Etcher?'
    ].join(' '))

  },

  /**
   * @summary Error messages
   * @namespace error
   * @memberof messages
   */
  error: {

    notEnoughSpaceInDrive: _.template([
      'Not enough space on the drive.',
      'Please insert larger one and try again.'
    ].join(' ')),

    genericFlashError: _.template('Oops, seems something went wrong.'),

    validation: _.template([
      'The write has been completed successfully but Etcher detected potential',
      'corruption issues when reading the image back from the drive.',
      '\n\nPlease consider writing the image to a different drive.'
    ].join(' ')),

    invalidImage: _.template('<%= image.path %> is not a supported image type.'),

    elevationRequired: _.template('This should should be run with root/administrator permissions.'),

    flashFailure: _.template('Looks like your flash has failed!')

  }

};
