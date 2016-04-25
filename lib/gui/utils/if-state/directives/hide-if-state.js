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
 * @summary HideIfState directive
 * @function
 * @public
 *
 * @description
 * This directive provides an attribute to hide an element
 * when the current UI Router state matches the specified one.
 *
 * @param {Object} $state - ui router $state
 * @returns {Object} directive
 *
 * @example
 * <button hide-if-state="settings" ui-sref="main">Go Back</button>
 */
module.exports = function($state) {
  return {
    restrict: 'A',
    scope: {
      hideIfState: '@'
    },
    link: function(scope, element) {
      scope.$watch(function() {
        return $state.is(scope.hideIfState);
      }, function(isState) {

        if (isState) {
          element.css('display', 'none');
        } else {
          element.css('display', 'initial');
        }

      });
    }
  };
};
