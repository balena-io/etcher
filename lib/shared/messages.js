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

    flashComplete: _.template([
      '<%= imageBasename %> was successfully written to',
      '<%= drive.description %> (<%= drive.name %>)'
    ].join(' '))

  },

  /**
   * @summary Warning messages
   * @namespace warning
   * @memberof messages
   */
  warning: {

    unrecommendedDriveSize: _.template([
      'This image recommends a <%= image.recommendedDriveSize %>',
      'bytes drive, however <%= drive.device %> is only <%= drive.size %> bytes.'
    ].join(' ')),

    exitWhileFlashing: _.template([
      'You are currently flashing a drive.',
      'Closing Etcher may leave your drive in an unusable state.'
    ].join(' ')),

    looksLikeWindowsImage: _.template([
      'It looks like you are trying to burn a Windows image.\n\n',
      'Unlike other images, Windows images require special processing to be made bootable.',
      'We suggest you use a tool specially designed for this purpose, such as',
      '<a href="https://rufus.akeo.ie">Rufus</a> (Windows) or Boot Camp Assistant (macOS).'
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

    openImage: _.template([
      'Something went wrong while opening <%= imageBasename %>\n\n',
      'Error: <%= errorMessage %>'
    ].join('')),

    elevationRequired: _.template('This should should be run with root/administrator permissions.'),

    flashFailure: _.template([
      'Something went wrong while writing <%= imageBasename %>',
      'to <%= drive.description %> (<%= drive.name %>)'
    ].join(' ')),

    driveUnplugged: _.template([
      'Looks like Etcher lost access to the drive.',
      'Did it get unplugged accidentally?',
      '\n\nSometimes this error is caused by faulty readers that don\'t provide stable access to the drive.'
    ].join(' ')),

    inputOutput: _.template([
      'Looks like Etcher is not able to write to this location of the drive.',
      'This error is usually caused by a faulty drive, reader, or port.',
      '\n\nPlease try again with another drive, reader, or port.'
    ].join(' '))

  }

};
