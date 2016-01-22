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

var _ = require('lodash');
var electron = require('electron');
var isElevated = require('is-elevated');
var sudoPrompt = require('sudo-prompt');
var os = require('os');
var platform = os.platform();

exports.require = function(app, callback) {
  'use strict';

  isElevated(function(error, elevated) {
    if (error) {
      return callback(error);
    }

    if (elevated) {
      return callback();
    }

    if (!elevated) {

      if (platform === 'darwin') {

        // Keep parent process hidden
        app.dock.hide();

        sudoPrompt.exec(process.argv.join(' '), {
          name: 'Resin Etcher'
        }, function(error) {
          if (error) {
            console.error(error.message);
            process.exit(1);
          }

          // Don't keep the original parent process alive
          process.exit(0);
        });
      }
      else if (platform === 'win32') {
        var elevator = require('elevator');

        elevator.execute(process.argv, {}, function(error) {
          if (error) {
            console.error(error.message);
            process.exit(1);
          }

          // Don't keep the original parent process alive
          process.exit(0);
        });
      }
      else {
        electron.dialog.showErrorBox(
          'You don\'t have enough permissions',
          'Please run this application as root or administrator'
        );

        process.exit(1);
      }
    }
  });
};
