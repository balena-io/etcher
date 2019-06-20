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
const uuidV4 = require('uuid/v4')
const store = require('../../../models/store')
// eslint-disable-next-line node/no-missing-require
const settings = require('../../../models/settings')
const flashState = require('../../../models/flash-state')
const selectionState = require('../../../models/selection-state')
const analytics = require('../../../modules/analytics')
const updateLock = require('../../../modules/update-lock')
const messages = require('../../../../../gui/app/modules/messages')

module.exports = function ($state) {
  /**
   * @summary Settings model
   * @type {Object}
   * @public
   */
  this.settings = settings

  /**
   * @summary Flash state
   * @type {Object}
   * @public
   */
  this.flash = flashState

  this.progressMessage = messages.progress

  this.results = this.flash.getFlashResults().results || {}

  /**
   * @summary Restart the flashing process
   * @function
   * @public
   *
   * @param {Object} [options] - options
   * @param {Boolean} [options.preserveImage=false] - preserve image
   *
   * @example
   * FinishController.restart({ preserveImage: true });
   */
  this.restart = (options) => {
    if (!options.preserveImage) {
      selectionState.deselectImage()
    }
    selectionState.deselectAllDrives()
    analytics.logEvent('Restart', _.assign({
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    }, options))

    // Re-enable lock release on inactivity
    updateLock.resume()

    // Reset the flashing workflow uuid
    store.dispatch({
      type: 'SET_FLASHING_WORKFLOW_UUID',
      data: uuidV4()
    })

    $state.go('main')
  }

  /**
   * @summary Format the result errors with newlines
   * @function
   * @public
   *
   * @returns {String} formatted errors
   *
   * @example
   * const errors = FinishController.formattedErrors()
   * console.log(errors)
   */
  this.formattedErrors = () => {
    const errors = _.map(_.get(flashState.getFlashResults(), [ 'results', 'errors' ]), (error) => {
      return `${error.device}: ${error.message || error.code}`
    })
    return errors.join('\n')
  }
}
