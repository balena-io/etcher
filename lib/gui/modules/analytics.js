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

/**
 * @module Etcher.Modules.Analytics
 */

const _ = require('lodash');
const angular = require('angular');
const username = require('username');
const isRunningInAsar = require('electron-is-running-in-asar');
const app = require('electron').remote.app;
const packageJSON = require('../../../package.json');

// Force Mixpanel snippet to load Mixpanel locally
// instead of using a CDN for performance reasons
window.MIXPANEL_CUSTOM_LIB_URL = '../../bower_components/mixpanel/mixpanel.js';

require('../../../bower_components/mixpanel/mixpanel-jslib-snippet.js');
require('../../../bower_components/angular-mixpanel/src/angular-mixpanel');
const MODULE_NAME = 'Etcher.Modules.Analytics';
const analytics = angular.module(MODULE_NAME, [
  'analytics.mixpanel',
  require('../models/settings')
]);

// Mixpanel integration
// https://github.com/kuhnza/angular-mixpanel

analytics.config(($mixpanelProvider) => {
  $mixpanelProvider.apiKey('63e5fc4563e00928da67d1226364dd4c');

  $mixpanelProvider.superProperties({

    /* eslint-disable camelcase */

    distinct_id: username.sync(),

    /* eslint-enable camelcase */

    electron: app.getVersion(),
    node: process.version,
    arch: process.arch,
    version: packageJSON.version
  });
});

// TrackJS integration
// http://docs.trackjs.com/tracker/framework-integrations

analytics.run(($window) => {

  // Don't configure TrackJS when
  // running inside the test suite
  if (window.mocha) {
    return;
  }

  $window.trackJs.configure({
    userId: username.sync(),
    version: packageJSON.version
  });
});

analytics.service('AnalyticsService', function($log, $window, $mixpanel, SettingsModel) {

  /**
   * @summary Log a debug message
   * @function
   * @public
   *
   * @description
   * This function sends the debug message to TrackJS only.
   *
   * @param {String} message - message
   *
   * @example
   * AnalyticsService.log('Hello World');
   */
  this.logDebug = (message) => {
    message = new Date() + ' ' + message;

    if (SettingsModel.get('errorReporting') && isRunningInAsar()) {
      $window.trackJs.console.debug(message);
    }

    $log.debug(message);
  };

  /**
   * @summary Log an event
   * @function
   * @public
   *
   * @description
   * This function sends the debug message to TrackJS and Mixpanel.
   *
   * @param {String} message - message
   * @param {Object} [data] - event data
   *
   * @example
   * AnalyticsService.logEvent('Select image', {
   *   image: '/dev/disk2'
   * });
   */
  this.logEvent = (message, data) => {

    if (SettingsModel.get('errorReporting') && isRunningInAsar()) {

      // Clone data before passing it to `mixpanel.track`
      // since this function mutates the object adding
      // some custom private Mixpanel properties.
      $mixpanel.track(message, _.clone(data));

    }

    if (data) {
      message += ` (${JSON.stringify(data)})`;
    }

    this.logDebug(message);
  };

  /**
   * @summary Log an exception
   * @function
   * @public
   *
   * @description
   * This function logs an exception in TrackJS.
   *
   * @param {Error} exception - exception
   *
   * @example
   * AnalyticsService.logException(new Error('Something happened'));
   */
  this.logException = (exception) => {
    if (SettingsModel.get('errorReporting') && isRunningInAsar()) {
      $window.trackJs.track(exception);
    }

    $log.error(exception);
  };

});

module.exports = MODULE_NAME;
