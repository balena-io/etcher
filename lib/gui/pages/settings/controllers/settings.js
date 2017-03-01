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

const os = require('os');

module.exports = function(WarningModalService, SettingsModel, ErrorService) {

  /**
   * @summary Client platform
   * @type String
   * @constant
   * @public
   */
  this.platform = os.platform();

  /**
   * @summary Refresh current settings
   * @function
   * @public
   */
  this.refreshSettings = () => {
    this.currentData = SettingsModel.getAll();
  };

  /**
   * @summary Current settings value
   * @type Object
   * @public
   */
  this.currentData = {};
  this.refreshSettings();

  /**
   * @summary Settings model
   * @type Object
   * @public
   */
  this.model = SettingsModel;

  /**
   * @summary Enable a dangerous setting
   * @function
   * @public
   *
   * @param {String} name - setting name
   * @param {Object} options - options
   * @param {String} options.description - modal description
   * @param {String} options.confirmationLabel - modal confirmation label
   * @returns {Undefined}
   *
   * @example
   * SettingsController.enableDangerousSetting('unsafeMode', {
   *   description: 'Don\'t do this!',
   *   confirmationLabel: 'Do it!'
   * });
   */
  this.enableDangerousSetting = (name, options) => {
    if (!this.currentData[name]) {
      this.model.set(name, false);
      return this.refreshSettings();
    }

    // Keep the checkbox unchecked until the user confirms
    this.currentData[name] = false;

    return WarningModalService.display(options).then((userAccepted) => {
      if (userAccepted) {
        this.model.set(name, true);
        this.refreshSettings();
      }
    }).catch(ErrorService.reportException);
  };

};
