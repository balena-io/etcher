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

module.exports = function($uibModal, $q) {

  /**
   * @summary Open a modal
   * @function
   * @public
   *
   * @param {Object} options - options
   * @param {String} options.template - template path
   * @param {String} options.controller - controller
   * @param {String} [options.size='sm'] - modal size
   * @param {Object} options.resolve - modal resolves
   * @returns {Object} modal
   *
   * @example
   * ModalService.open({
   *   template: './path/to/modal.tpl.html',
   *   controller: 'DriveSelectorController as modal',
   * });
   */
  this.open = (options = {}) => {

    _.defaults(options, {
      size: 'sm'
    });

    const modal = $uibModal.open({
      animation: true,
      templateUrl: options.template,
      controller: options.controller,
      size: options.size,
      resolve: options.resolve
    });

    return {
      close: modal.close,
      result: $q((resolve, reject) => {
        modal.result
          .then(resolve)
          .catch((error) => {

            // For some annoying reason, UI Bootstrap Modal rejects
            // the result reason if the user clicks on the backdrop
            // (e.g: the area surrounding the modal).
            if (error !== 'backdrop click') {
              return reject(error);
            }

          });
      })
    };
  };

};
