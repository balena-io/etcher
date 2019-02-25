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
const store = require('../../../models/store')
const analytics = require('../../../modules/analytics')

module.exports = function ($uibModal, $q) {
  /**
   * @summary Open a modal
   * @function
   * @public
   *
   * @param {Object} options - options
   * @param {String} options.template - template contents
   * @param {String} options.controller - controller
   * @param {String} [options.size='sm'] - modal size
   * @param {Object} options.resolve - modal resolves
   * @returns {Object} modal
   *
   * @example
   * ModalService.open({
   *   name: 'my modal',
   *   template: require('./path/to/modal.tpl.html'),
   *   controller: 'DriveSelectorController as modal',
   * });
   */
  this.open = (options = {}) => {
    _.defaults(options, {
      size: 'sm'
    })

    analytics.logEvent('Open modal', {
      name: options.name,
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })

    const modal = $uibModal.open({
      animation: true,
      template: options.template,
      controller: options.controller,
      size: options.size,
      resolve: options.resolve,
      backdrop: 'static'
    })

    return {
      close: modal.close,
      result: $q((resolve, reject) => {
        modal.result.then((value) => {
          analytics.logEvent('Modal accepted', {
            name: options.name,
            value,
            applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
            flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
          })

          resolve(value)
        }).catch((error) => {
          // Bootstrap doesn't 'resolve' these but cancels the dialog
          if (error === 'escape key press') {
            analytics.logEvent('Modal rejected', {
              name: options.name,
              method: error,
              applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
              flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
            })

            return resolve()
          }

          analytics.logEvent('Modal rejected', {
            name: options.name,
            value: error,
            applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
            flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
          })

          return reject(error)
        })
      })
    }
  }
}
