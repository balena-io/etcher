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
const electron = require('electron');
const errors = require('../../shared/errors');
const supportedFormats = require('../../shared/supported-formats');

/**
 * @summary Current renderer BrowserWindow instance
 * @type {Object}
 * @private
 */
const currentWindow = electron.remote.getCurrentWindow();

/**
 * @summary Open an image selection dialog
 * @function
 * @public
 *
 * @description
 * Notice that by image, we mean *.img/*.iso/*.zip/etc files.
 *
 * @fulfil {Object} - selected image
 * @returns {Promise};
 *
 * @example
 * osDialog.selectImage().then((image) => {
 *   console.log('The selected image is', image.path);
 * });
 */
exports.selectImage = () => {
  return new Promise((resolve) => {
    electron.remote.dialog.showOpenDialog(currentWindow, {

      // This variable is set when running in GNU/Linux from
      // inside an AppImage, and represents the working directory
      // from where the AppImage was run (which might not be the
      // place where the AppImage is located). `OWD` stands for
      // "Original Working Directory".
      //
      // See: https://github.com/probonopd/AppImageKit/commit/1569d6f8540aa6c2c618dbdb5d6fcbf0003952b7
      defaultPath: process.env.OWD,

      properties: [
        'openFile'
      ],
      filters: [
        {
          name: 'OS Images',
          extensions: _.sortBy(supportedFormats.getAllExtensions())
        }
      ]
    }, (files) => {

      // `_.first` is smart enough to not throw and return `undefined`
      // if we pass it an `undefined` value (e.g: when the selection
      // dialog was cancelled).
      return resolve(_.first(files));

    });
  });
};

/**
 * @summary Open a warning dialog
 * @function
 * @public
 *
 * @param {Object} options - options
 * @param {String} options.title - dialog title
 * @param {String} options.description - dialog description
 * @param {String} [options.confirmationLabel="OK"] - confirmation label
 * @param {String} [options.rejectionLabel="Cancel"] - rejection label
 * @fulfil {Boolean} - whether the dialog was confirmed or not
 * @returns {Promise};
 *
 * @example
 * osDialog.showWarning({
 *   title: 'This is a warning',
 *   description: 'Are you sure you want to continue?',
 *   confirmationLabel: 'Yes, continue',
 *   rejectionLabel: 'Cancel'
 * }).then((confirmed) => {
 *   if (confirmed) {
 *     console.log('The dialog was confirmed');
 *   }
 * });
 */
exports.showWarning = (options) => {
  _.defaults(options, {
    confirmationLabel: 'OK',
    rejectionLabel: 'Cancel'
  });

  const BUTTONS = [
    options.confirmationLabel,
    options.rejectionLabel
  ];

  const BUTTON_CONFIRMATION_INDEX = _.indexOf(BUTTONS, options.confirmationLabel);
  const BUTTON_REJECTION_INDEX = _.indexOf(BUTTONS, options.rejectionLabel);

  return new Promise((resolve) => {
    electron.remote.dialog.showMessageBox(currentWindow, {
      type: 'warning',
      buttons: BUTTONS,
      defaultId: BUTTON_REJECTION_INDEX,
      cancelId: BUTTON_REJECTION_INDEX,
      title: 'Attention',
      message: options.title,
      detail: options.description
    }, (response) => {
      return resolve(response === BUTTON_CONFIRMATION_INDEX);
    });
  });
};

/**
 * @summary Show error dialog for an Error instance
 * @function
 * @public
 *
 * @param {Error} error - error
 *
 * @example
 * osDialog.showError(new Error('Foo Bar'));
 */
exports.showError = (error) => {
  const title = errors.getTitle(error);
  const message = errors.getDescription(error);
  electron.remote.dialog.showErrorBox(title, message);
};
