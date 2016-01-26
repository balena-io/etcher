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
let mainWindow = null;

electron.app.on('window-all-closed', electron.app.quit);

electron.app.on('ready', function() {

  // No menu bar
  electron.Menu.setApplicationMenu(null);

  elevate.require(electron.app, function(error) {

    if (error) {
      throw error;
    }

    mainWindow = new electron.BrowserWindow({
      width: 800,
      height: 380,
      resizable: false,
      fullscreen: false,
      icon: path.join(__dirname, '..', 'assets', 'icon.png')
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

