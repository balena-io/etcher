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
 * @summary OsOpenExternal directive
 * @function
 * @public
 *
 * @description
 * This directive provides an attribute to open an external
 * resource with the default operating system action.
 *
 * @param {Object} OSOpenExternalService - OSOpenExternalService
 * @returns {Object} directive
 *
 * @example
 * <button os-open-external="https://resin.io">Resin.io</button>
 */
module.exports = (OSOpenExternalService) => {
  return {
    restrict: 'A',
    scope: false,
    link: (scope, element, attributes) => {

      // This directive might be added to elements
      // other than buttons.
      element.css('cursor', 'pointer');

      element.on('click', () => {
        OSOpenExternalService.open(attributes.osOpenExternal);
      });
    }
  };
};
