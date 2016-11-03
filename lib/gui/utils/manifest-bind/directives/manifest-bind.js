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
 * @summary ManifestBind directive
 * @function
 * @public
 *
 * @description
 * This directive provides an attribute to bind the current
 * element value to a property in `package.json`.
 *
 * @param {Object} ManifestBindService - ManifestBindService
 * @returns {Object} directive
 *
 * @example
 * <span manifest-bind="version"></button>
 */
module.exports = (ManifestBindService) => {
  return {
    restrict: 'A',
    scope: false,
    link: (scope, element, attributes) => {
      const value = ManifestBindService.get(attributes.manifestBind);

      if (!value) {
        throw new Error('ManifestBind: Unknown property `' + attributes.manifestBind + '`');
      }

      element.html(value);
    }
  };
};
