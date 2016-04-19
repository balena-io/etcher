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

const Bluebird = require('bluebird');
const isElevated = Bluebird.promisify(require('is-elevated'));
const sudoPrompt = Bluebird.promisifyAll(require('sudo-prompt'));
const platform = require('os').platform();

exports.require = function(app, applicationName, callback) {
  return isElevated().then(function(elevated) {

    if (elevated) {
      return;
    }

    return Bluebird.try(function() {
      if (platform === 'darwin') {

        // Keep parent process hidden
        app.dock.hide();

        return sudoPrompt.execAsync(process.argv.join(' '), {
          name: applicationName
        });
      }

      if (platform === 'win32') {
        const elevator = Bluebird.promisifyAll(require('elevator'));
        return elevator.executeAsync(process.argv, {});
      }

      throw new Error('Please run this application as root or administrator');
    }).then(function() {

      // Don't keep the original parent process alive
      process.exit(0);

    });

  }).nodeify(callback);
};
