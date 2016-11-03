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

const _ = require('lodash');
const path = require('path');
const fs = require('fs');

/**
 * @summary SVGIcon directive
 * @function
 * @public
 *
 * @description
 * This directive provides an easy way to load SVG icons
 * by embedding the SVG contents inside the element, making
 * it possible to style icons with CSS.
 *
 * @returns {Object}
 *
 * @example
 * <svg-icon path="path/to/icon.svg" width="40px" height="40px"></svg-icon>
 */
module.exports = () => {
  return {
    templateUrl: './components/svg-icon/templates/svg-icon.tpl.html',
    replace: true,
    restrict: 'E',
    scope: {
      path: '@',
      width: '@',
      height: '@'
    },
    link: (scope, element) => {
      element.css('width', scope.width || '40px');
      element.css('height', scope.height || '40px');

      scope.$watch('path', (value) => {

        // The path contains SVG contents
        if (_.first(value) === '<') {
          element.html(value);

        } else {

          // This means the path to the icon should be
          // relative to *this directory*.
          // TODO: There might be a way to compute the path
          // relatively to the `index.html`.
          const imagePath = path.join(__dirname, value);

          const contents = fs.readFileSync(imagePath, {
            encoding: 'utf8'
          });

          element.html(contents);
        }
      });
    }
  };
};
