/*
 * Copyright 2016 Resin.io
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

/**
 * @module Etcher.settings
 */

const angular = require('angular');

require('ngstorage');
const settings = angular.module('Etcher.settings', [
  'ngStorage'
]);

settings.service('SettingsService', function($localStorage) {

  /**
   * @summary Settings data
   * @type Object
   * @public
   */
  this.data = $localStorage.$default({
    errorReporting: true
  });

  // All this functionality should be gone once
  // we make use of a real router on the application.
  // This is not the case yet since when the application
  // was first prototyped there was only one screen
  // and therefore a router would have been overkill.

  /**
   * @summary Configuring state
   * @type Boolean
   * @private
   */
  let configuring = false;

  /**
   * @summary Check if the user is configuring
   * @function
   * @public
   *
   * @returns {Boolean} whether is configuring
   *
   * @example
   * if (SettingsService.isConfiguring()) {
   *   console.log('User is on settings screen');
   * }
   */
  this.isConfiguring = function() {
    return configuring;
  };

  /**
   * @summary Enter settings screen
   * @function
   * @public
   *
   * @example
   * SettingsService.enter();
   */
  this.enter = function() {
    configuring = true;
  };

  /**
   * @summary Leave settings screen
   * @function
   * @public
   *
   * @example
   * SettingsService.leave();
   */
  this.leave = function() {
    configuring = false;
  };

});
