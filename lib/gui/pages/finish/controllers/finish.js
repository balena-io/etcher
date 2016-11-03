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

module.exports = function($state, FlashStateModel, SelectionStateModel, AnalyticsService, SettingsModel) {

  /**
   * @summary Settings model
   * @type Object
   * @public
   */
  this.settings = SettingsModel;

  /**
   * @summary Source checksum
   * @type String
   * @public
   */
  this.checksum = FlashStateModel.getLastFlashSourceChecksum();

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
    SelectionStateModel.clear(options);
    AnalyticsService.logEvent('Restart', options);
    $state.go('main');
  };

};
