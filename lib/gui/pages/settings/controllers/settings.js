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
const _ = require('lodash');
const settings = require('../../../models/settings');
const analytics = require('../../../modules/analytics');
const exception = require('../../../modules/exception');

module.exports = function(WarningModalService) {

  /**
   * @summary Client platform
   * @type {String}
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
    this.currentData = settings.getAll();
  };

  /**
   * @summary Current settings value
   * @type {Object}
   * @public
   */
  this.currentData = {};
  this.refreshSettings();

  /**
   * @summary Settings model
   * @type {Object}
   * @public
   */
  this.model = settings;

  /**
   * @summary Toggle setting
   * @function
   * @public
   *
   * @description
   * If warningOptions is given, it should be an object having `description` and `confirmationLabel`;
   * these will be used to present a user confirmation modal before enabling the setting.
   * If warningOptions is missing, no confirmation modal is displayed.
   *
   * @param {String} setting - setting key
   * @param {Object} [options] - options
   * @param {String} [options.description] - warning modal description
   * @param {String} [options.confirmationLabel] - warning modal confirmation label
   * @returns {Undefined}
   *
   * @example
   * SettingsController.toggle('unsafeMode', {
   *   description: 'Don\'t do this!',
   *   confirmationLabel: 'Do it!'
   * });
   */
  this.toggle = (setting, options) => {

    const value = this.currentData[setting];
    const dangerous = !_.isUndefined(options);

    analytics.logEvent('Toggle setting', {
      setting,
      value,
      dangerous
    });

    if (!value || !dangerous) {
      return this.model.set(setting, value);
    }

    // Keep the checkbox unchecked until the user confirms
    this.currentData[setting] = false;

    return WarningModalService.display(options).then((userAccepted) => {
      if (userAccepted) {
        this.model.set(setting, true);
        this.refreshSettings();
      }
    }).catch(exception.report);
  };

};
