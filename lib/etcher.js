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
const path = require('path');
const elevate = require('./elevate');
const fileExists = require('file-exists');
const args = require('yargs')
      .usage('Usage: $0 [options] [image_file]')
      .example('$0 /path/to/image.img', 'write image.img to a device')
      .help('h')
      .alias('h', 'help')
      .epilog('supported image formats: .img .iso .zip')
      .check(function(args) {

        if (args._.length > 1) {
          throw new Error(args._.length + ' images specified.  (Only one image file is allowed.)');
        }

        if (!fileExists(args._[0])) {
          throw new Error(args._[0] + ' is not a valid image file.');
        }

        return true;
      })
      .argv;

let mainWindow = null;

electron.app.on('window-all-closed', electron.app.quit);

electron.app.on('ready', function() {

  // No menu bar
  electron.Menu.setApplicationMenu(null);

  elevate.require(electron.app, function(error) {

    if (error) {
      electron.dialog.showErrorBox('Elevation Error', error.message);
      return process.exit(1);
    }

    mainWindow = new electron.BrowserWindow({
      width: 800,
      height: 380,
      useContentSize: true,
      show: false,
      resizable: false,
      fullscreen: false,
      titleBarStyle: 'hidden-inset',
      icon: path.join(__dirname, '..', 'assets', 'icon.png')
    });

    // Prevent flash of white when starting the application
    // https://github.com/atom/electron/issues/2172
    mainWindow.webContents.on('did-finish-load', function() {

      // The flash of white is still present for a very short
      // while after the WebView reports it finished loading
      setTimeout(function() {
        mainWindow.show();
      }, 100);

      if (args._.length === 1) {
        mainWindow.webContents.executeJavaScript(
          'angular.element(document.getElementById("appcontainer")).scope().app.selectImage("' + args._[0] + '");'
        );
      }
    });

    mainWindow.on('closed', function() {
      mainWindow = null;
    });

    electron.globalShortcut.register('CmdOrCtrl+Alt+I', function() {
      mainWindow.webContents.openDevTools();
    });

    mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
  });
});

