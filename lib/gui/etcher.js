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
const elevate = require('../src/elevate');
const packageJSON = require('../../package.json');
let mainWindow = null;

electron.app.on('window-all-closed', electron.app.quit);

electron.app.on('ready', function() {

  // No menu bar
  electron.Menu.setApplicationMenu(null);

  elevate.require(electron.app, packageJSON.displayName, function(error) {

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
      icon: path.join(__dirname, '..', '..', 'assets', 'icon.png')
    });

    // Prevent flash of white when starting the application
    // https://github.com/atom/electron/issues/2172
    mainWindow.webContents.on('did-finish-load', function() {

      // The flash of white is still present for a very short
      // while after the WebView reports it finished loading
      setTimeout(function() {
        mainWindow.show();
      }, 100);

    });

    mainWindow.on('closed', function() {
      mainWindow = null;
    });

    // For some reason, Electron shortcuts are registered
    // globally, which means that the app listers for shorcuts
    // even if its not currently focused, potentially interferring
    // with shorcuts registered by other applications.
    // As a workaround, we register all shortcuts when the windows
    // gains focus, and unregister them when the windows loses focus.
    // See http://electron.atom.io/docs/api/global-shortcut/

    mainWindow.on('focus', function() {
      electron.globalShortcut.register('CmdOrCtrl+Alt+I', function() {
        mainWindow.webContents.openDevTools();
      });
    });

    mainWindow.on('blur', function() {
      electron.globalShortcut.unregisterAll();
    });

    // Prevent external resources from being loaded (like images)
    // when dropping them on the WebView.
    // See https://github.com/electron/electron/issues/5919
    mainWindow.webContents.on('will-navigate', function(event) {
      event.preventDefault();
    });

    mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
  });
});

