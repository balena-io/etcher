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
 * @module Etcher.analytics
 */

const _ = require('lodash');
const angular = require('angular');
const username = require('username');
const app = require('electron').remote.app;
const packageJSON = require('../../../package.json');

// Force Mixpanel snippet to load Mixpanel locally
// instead of using a CDN for performance reasons
window.MIXPANEL_CUSTOM_LIB_URL = '../../bower_components/mixpanel/mixpanel.js';

require('../../../bower_components/mixpanel/mixpanel-jslib-snippet.js');
require('../../../bower_components/angular-mixpanel/src/angular-mixpanel');
const MODULE_NAME = 'Etcher.analytics';
const analytics = angular.module(MODULE_NAME, [
  'analytics.mixpanel',
  require('../models/settings')
]);

analytics.config(function($mixpanelProvider) {
  $mixpanelProvider.apiKey('63e5fc4563e00928da67d1226364dd4c');

  $mixpanelProvider.superProperties({

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers

    distinct_id: username.sync(),

    // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

    electron: app.getVersion(),
    node: process.version,
    arch: process.arch,
    version: packageJSON.version
  });
});

// TrackJS integration
// http://docs.trackjs.com/tracker/framework-integrations

analytics.run(function($window) {
  if ($window.trackJs) {
    $window.trackJs.configure({
      userId: username.sync(),
      version: packageJSON.version
    });
  }
});

analytics.config(function($provide) {
  $provide.decorator('$exceptionHandler', function($delegate, $window, $injector) {
    return function(exception, cause) {
      const SettingsModel = $injector.get('SettingsModel');

      if (SettingsModel.data.errorReporting) {
        $window.trackJs.track(exception);
      }

      $delegate(exception, cause);
    };
  });

  $provide.decorator('$log', function($delegate, $window, $injector) {

    // Save the original $log.debug()
    let debugFn = $delegate.debug;

    $delegate.debug = function(message) {
      message = new Date() + ' ' + message;

      const SettingsModel = $injector.get('SettingsModel');

      if (SettingsModel.data.errorReporting) {
        $window.trackJs.console.debug(message);
      }

      debugFn.call(null, message);
    };

    return $delegate;
  });
});

analytics.service('AnalyticsService', function($log, $mixpanel, SettingsModel) {
  let self = this;

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
  this.log = function(message) {
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
  this.logEvent = function(message, data) {

    if (SettingsModel.data.errorReporting) {

      // Clone data before passing it to `mixpanel.track`
      // since this function mutates the object adding
      // some custom private Mixpanel properties.
      $mixpanel.track(message, _.clone(data));

    }

    if (data) {
      message += ` (${JSON.stringify(data)})`;
    }

    self.log(message);
  };

});

module.exports = MODULE_NAME;
