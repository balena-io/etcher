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
const Bluebird = require('bluebird')
const path = require('path')
const messages = require('../../../../shared/messages')
const errors = require('../../../../shared/errors')
const imageStream = require('../../../../image-stream')
const supportedFormats = require('../../../../shared/supported-formats')
const analytics = require('../../../modules/analytics')
const selectionState = require('../../../../shared/models/selection-state')
const osDialog = require('../../../os/dialog')
const exceptionReporter = require('../../../modules/exception-reporter')

module.exports = function (
  $timeout,
  WarningModalService
) {
  /**
   * @summary Main supported extensions
   * @constant
   * @type {String[]}
   * @public
   */
  this.mainSupportedExtensions = _.intersection([
    'img',
    'iso',
    'zip'
  ], supportedFormats.getAllExtensions())

  /**
   * @summary Extra supported extensions
   * @constant
   * @type {String[]}
   * @public
   */
  this.extraSupportedExtensions = _.difference(
    supportedFormats.getAllExtensions(),
    this.mainSupportedExtensions
  ).sort()

  /**
   * @summary Select image
   * @function
   * @public
   *
   * @param {Object} image - image
   *
   * @example
   * osDialogService.selectImage()
   *   .then(ImageSelectionController.selectImage);
   */
  this.selectImage = (image) => {
    if (!supportedFormats.isSupportedImage(image.path)) {
      const invalidImageError = errors.createUserError({
        title: 'Invalid image',
        description: messages.error.invalidImage({
          image
        })
      })

      osDialog.showError(invalidImageError)
      analytics.logEvent('Invalid image', image)
      return
    }

    Bluebird.try(() => {
      let message = null

      if (supportedFormats.looksLikeWindowsImage(image.path)) {
        analytics.logEvent('Possibly Windows image', image)
        message = messages.warning.looksLikeWindowsImage()
      } else if (!image.hasMBR) {
        analytics.logEvent('Missing partition table', image)
        message = messages.warning.missingPartitionTable()
      }

      if (message) {
        // TODO: `Continue` should be on a red background (dangerous action) instead of `Change`.
        // We want `X` to act as `Continue`, that's why `Continue` is the `rejectionLabel`
        return WarningModalService.display({
          confirmationLabel: 'Change',
          rejectionLabel: 'Continue',
          description: message
        })
      }

      return false
    }).then((shouldChange) => {
      if (shouldChange) {
        return this.reselectImage()
      }

      selectionState.setImage(image)

      // An easy way so we can quickly identify if we're making use of
      // certain features without printing pages of text to DevTools.
      image.logo = Boolean(image.logo)
      image.bmap = Boolean(image.bmap)

      return analytics.logEvent('Select image', image)
    }).catch(exceptionReporter.report)
  }

  /**
   * @summary Select an image by path
   * @function
   * @public
   *
   * @param {String} imagePath - image path
   *
   * @example
   * ImageSelectionController.selectImageByPath('path/to/image.img');
   */
  this.selectImageByPath = (imagePath) => {
    imageStream.getImageMetadata(imagePath)
      .then((imageMetadata) => {
        $timeout(() => {
          this.selectImage(imageMetadata)
        })
      })
      .catch((error) => {
        const imageError = errors.createUserError({
          title: 'Error opening image',
          description: messages.error.openImage({
            imageBasename: path.basename(imagePath),
            errorMessage: error.message
          })
        })

        osDialog.showError(imageError)
        analytics.logException(error)
      })
  }

  /**
   * @summary Open image selector
   * @function
   * @public
   *
   * @example
   * ImageSelectionController.openImageSelector();
   */
  this.openImageSelector = () => {
    analytics.logEvent('Open image selector')

    osDialog.selectImage().then((imagePath) => {
      // Avoid analytics and selection state changes
      // if no file was resolved from the dialog.
      if (!imagePath) {
        analytics.logEvent('Image selector closed')
        return
      }

      this.selectImageByPath(imagePath)
    }).catch(exceptionReporter.report)
  }

  /**
   * @summary Reselect image
   * @function
   * @public
   *
   * @example
   * ImageSelectionController.reselectImage();
   */
  this.reselectImage = () => {
    analytics.logEvent('Reselect image', {
      previousImage: selectionState.getImage()
    })

    this.openImageSelector()
  }

  /**
   * @summary Get the basename of the selected image
   * @function
   * @public
   *
   * @returns {String} basename of the selected image
   *
   * @example
   * const imageBasename = ImageSelectionController.getImageBasename();
   */
  this.getImageBasename = () => {
    if (!selectionState.hasImage()) {
      return ''
    }

    return path.basename(selectionState.getImagePath())
  }
}
