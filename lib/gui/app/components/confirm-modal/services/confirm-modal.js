/*
 * Copyright 2018 balena.io
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

module.exports = function ($sce, ModalService) {
  /**
   * @summary show the confirm modal
   * @function
   * @public
   *
   * @param {Object} options - options
   * @param {String} options.description - danger message
   * @param {String} options.confirmationLabel - confirmation button text
   * @param {String} options.rejectionLabel - rejection button text
   * @fulfil {Boolean} - whether the user accepted or rejected the confirm
   * @returns {Promise}
   *
   * @example
   * ConfirmModalService.show({
   *   description: 'Don\'t do this!',
   *   confirmationLabel: 'Yes, continue!'
   * });
   */
  this.show = (options = {}) => {
    options.description = $sce.trustAsHtml(options.description)
    return ModalService.open({
      name: 'confirm',
      template: require('../templates/confirm-modal.tpl.html'),
      controller: 'ConfirmModalController as modal',
      size: 'confirm-modal',
      resolve: {
        options: _.constant(options)
      }
    }).result
  }
}
