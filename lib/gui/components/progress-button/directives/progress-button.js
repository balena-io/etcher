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
 * @summary ProgressButton directive
 * @function
 * @public
 *
 * @description
 * This directive provides a button containing a progress bar inside.
 * The button is styled by default as a primary button.
 *
 * @returns {Object} directive
 *
 * @example
 * <progress-button percentage="{{ 40 }}" striped>My Progress Button</progress-button>
 */
module.exports = () => {
  return {
    templateUrl: './components/progress-button/templates/progress-button.tpl.html',
    restrict: 'E',
    replace: true,
    transclude: true,
    scope: {
      percentage: '=',
      striped: '@'
    }
  };
};
