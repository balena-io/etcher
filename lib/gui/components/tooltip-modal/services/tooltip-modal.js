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
   * @summary Open the tooltip modal
   * @function
   * @public
   *
   * @param {Object} options - tooltip options
   * @param {String} options.title - tooltip title
   * @param {String} options.message - tooltip message
   * @returns {Promise}
   *
   * @example
   * TooltipModalService.show({
   *   title: 'Important tooltip',
   *   message: 'Tooltip contents'
   * });
   */
  this.show = (options) => {
    return ModalService.open({
      template: './components/tooltip-modal/templates/tooltip-modal.tpl.html',
      controller: 'TooltipModalController as modal',
      size: 'tooltip-modal',
      resolve: {
        tooltipData: _.constant(options)
      }
    }).result;
  };

};
