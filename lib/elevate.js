/* The MIT License
 *
 * Copyright (c) 2015 Resin.io. https://resin.io.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var _ = require('lodash');
var dialog = require('dialog');
var isElevated = require('is-elevated');
var sudoPrompt = require('sudo-prompt');
var windosu = require('windosu');
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
          name: 'Herostratus'
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
        var command = _.map(process.argv, function(word) {
          return '"' + word + '"';
        });

        windosu.exec(command.join(' '), null, function(error) {
          if (error) {
            console.error(error.message);
            process.exit(1);
          }

          // Don't keep the original parent process alive
          process.exit(0);
        });
      }
      else {
        dialog.showErrorBox('You don\'t have enough permissions', 'Please run this application as root or administrator');
        process.exit(1);
      }
    }
  });
};
