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

module.exports = function(ModalService) {

  /**
   * @summary Display the warning modal
   * @function
   * @public
   *
   * @param {Object} options - options
   * @param {String} options.message - danger message
   * @param {String} [options.confirmButtonMessage='Yes, continue'] - confirm button message
   * @param {String} [options.rejectButtonMessage='Cancel'] - reject button message
   * @fulfil {Boolean} - whether the user accepted or rejected the warning
   * @returns {Promise}
   *
   * @example
   * WarningModalService.display({
   *   message: 'Don\'t do this!'
   * });
   */
  this.display = (options) => {

    _.defaults(options, {
      confirmButtonMessage: 'Yes, continue',
      rejectButtonMessage: 'Cancel'
    });

    return ModalService.open({
      template: './components/warning-modal/templates/warning-modal.tpl.html',
      controller: 'WarningModalController as modal',
      size: 'warning-modal',
      resolve: {
        options: _.constant(options)
      }
    }).result;
  };

};
