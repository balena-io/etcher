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
 * @module TrackJS
 */

const angular = require('angular');
const track = angular.module('TrackJS', []);

// TrackJS integration
// http://docs.trackjs.com/tracker/framework-integrations
track.config(function($provide) {
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
