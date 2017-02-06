/*
 * Copyright 2017 resin.io
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
 * @summary File-dropper directive
 * @function
 * @public
 *
 * @description
 * This directive provides an easy way to drop files into Etcher.
 *
 * @param {Object} $timeout - Angular timeout object.
 * @returns {Object}
 *
 * @example
 * <file-dropper
 *   icon="../../../assets/add-file.svg"
 *   text="Drop your file here"
 *   subtext="{{ getDescriptionText() }}"
 *   on-drop="handleFile($file)">
 * </file-dropper>
 */
module.exports = () => {
  return {
    templateUrl: './components/file-dropper/templates/file-dropper.tpl.html',
    replace: false,
    restrict: 'E',
    transclude: true,
    scope: {
      icon: '@',
      text: '@',
      subtext: '@',
      onDrop: '&',
      showOverlayIf: '='
    },
    link: (scope) => {
      scope.yank = (file) => {
        scope.onDrop({
          $file: file
        });
      };
    }
  };
};
