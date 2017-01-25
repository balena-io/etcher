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

module.exports = function(WarningModalService, FlashStateModel, SelectionStateModel, AnalyticsService) {

  /**
   * @summary Open the flash error modal
   * @function
   * @public
   *
   * @param {String} message - flash error message
   * @returns {Promise}
   *
   * @example
   * FlashErrorModalService.show('The drive is not large enough!');
   */
  this.show = (message) => {
    return WarningModalService.display({
      confirmationLabel: 'Retry',
      description: message
    }).then((confirmed) => {
      FlashStateModel.resetState();

      if (confirmed) {
        AnalyticsService.logEvent('Restart after failure');
      } else {
        SelectionStateModel.clear();
      }
    });
  };

};
