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

const electron = require('electron');
const shell = electron.remote.require('shell');
const os = require('os');
const nodeOpen = require('open');

/**
 * This directive provides an attribute to open an external
 * resource with the default operating system action.
 *
 * Example:
 *
 * <button open-external="https://resin.io">Resin.io</button>
 */

module.exports = function() {
  return {
    restrict: 'A',
    scope: {
      openExternal: '@'
    },
    link: function(scope, element) {

      // This directive might be added to elements
      // other than buttons.
      element.css('cursor', 'pointer');

      element.on('click', function() {

        // Electron's `shell.openExternal()` fails on GNU/Linux
        // when Electron is ran with `sudo`.
        // The issue was reported, and this is a workaround until
        // its fixed on the Electron side.
        // `node-open` is smart enough to check the `$SUDO_USER`
        // environment variable and to prepend `sudo -u <user>`
        // if needed.
        // We keep `shell.openExternal()` for OSes other than
        // Linux since we intend to fully rely on it when the
        // issue is fixed, and since its closer integration with
        // the operating system might lead to more accurate results
        // than a third party NPM module.
        //
        // See https://github.com/electron/electron/issues/5039
        if (os.platform() === 'linux') {
          return nodeOpen(scope.openExternal);
        }

        shell.openExternal(scope.openExternal);
      });
    }
  };
};
