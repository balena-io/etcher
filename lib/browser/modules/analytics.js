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

const angular = require('angular');
const username = require('username');
const app = require('electron').remote.app;

// Force Mixpanel snippet to load Mixpanel locally
// instead of using a CDN for performance reasons
window.MIXPANEL_CUSTOM_LIB_URL = '../bower_components/mixpanel/mixpanel.js';

require('../../../bower_components/mixpanel/mixpanel-jslib-snippet.js');
require('../../../bower_components/angular-mixpanel/src/angular-mixpanel');
const analytics = angular.module('Etcher.analytics', [
  'analytics.mixpanel'
]);

analytics.config(function($mixpanelProvider) {
  $mixpanelProvider.apiKey('63e5fc4563e00928da67d1226364dd4c');

  $mixpanelProvider.superProperties({
    distinct_id: username.sync(),
    version: app.getVersion(),
    node: process.version,
    arch: process.arch
  });
});

// TrackJS integration
// http://docs.trackjs.com/tracker/framework-integrations
analytics.config(function($provide) {
  $provide.decorator('$exceptionHandler', function($delegate, $window) {
    return function(exception, cause) {
      $window.trackJs.track(exception);
      $delegate(exception, cause);
    };
  });

  $provide.decorator('$log', function($delegate, $window) {

    // Save the original $log.debug()
    let debugFn = $delegate.debug;

    $delegate.debug = function(message) {
      message = new Date() + ' ' + message;
      $window.trackJs.console.debug(message);
      debugFn.call(null, message);
    };

    return $delegate;
  });
});

analytics.service('AnalyticsService', function($log, $mixpanel) {

  /**
   * @summary Log an event
   * @function
   * @private
   *
   * @param {String} message - message
   *
   * @example
   * AnalyticsService.log('Hello World');
   */
  this.log = function(message) {
    $mixpanel.track(message);
    $log.debug(message);
  };

});
