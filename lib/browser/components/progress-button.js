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
 * @module Etcher.Components.ProgressButton
 */

const angular = require('angular');
const ProgressButton = angular.module('Etcher.Components.ProgressButton', []);

ProgressButton.directive('progressButton', function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    scope: {
      percentage: '='
    },
    template: [
      '<button class="progress-button progress-button--primary">',
        '<span class="progress-button__content" ng-transclude></span>',
        '<span class="progress-button__bar" ng-style="{ width: percentage + \'%\' }"></span>',
      '</button>'
    ].join('\n')
  };
});
