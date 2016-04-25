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
 * @summary ShowIfState directive
 * @function
 * @public
 *
 * @description
 * This directive provides an attribute to show an element
 * when the current UI Router state matches the specified one.
 *
 * @param {Object} $state - ui router $state
 * @returns {Object} directive
 *
 * @example
 * <button show-if-state="main" ui-sref="settings">Settings</button>
 */
module.exports = function($state) {
  return {
    restrict: 'A',
    scope: {
      showIfState: '@'
    },
    link: function(scope, element) {
      scope.$watch(function() {
        return $state.is(scope.showIfState);
      }, function(isState) {

        if (isState) {
          element.css('display', 'initial');
        } else {
          element.css('display', 'none');
        }

      });
    }
  };
};
