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
const fs = require('fs');

/**
 * @summary Dropzone directive
 * @function
 * @public
 *
 * @description
 * This directive provides an attribute to detect a file
 * being dropped into the element.
 *
 * @param {Object} $timeout - Angular's timeout wrapper
 * @returns {Object} directive
 *
 * @example
 * <div os-dropzone="doSomething($file)">Drag a file here</div>
 */
module.exports = ($timeout) => {
  return {
    restrict: 'A',
    scope: {
      osDropzone: '&'
    },
    link: (scope, element) => {
      const domElement = element[0];

      // See https://github.com/electron/electron/blob/master/docs/api/file-object.md

      // We're not interested in these events
      domElement.ondragover = _.constant(false);
      domElement.ondragleave = _.constant(false);
      domElement.ondragend = _.constant(false);

      domElement.ondrop = (event) => {
        event.preventDefault();
        const filename = event.dataTransfer.files[0].path;

        // Safely bring this to the word of Angular
        $timeout(() => {
          scope.osDropzone({

            // Pass the filename as a named
            // parameter called `$file`
            $file: {
              path: filename,
              size: fs.statSync(filename).size
            }

          });
        });

        return false;
      };
    }
  };
};
