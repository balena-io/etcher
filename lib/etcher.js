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

var globalShortcut = require('global-shortcut');
var path = require('path');
var app = require('app');
var Menu = require('menu');
var ElectronWindow = require('electron-window');
var elevate = require('./elevate');

app.on('window-all-closed', app.quit);

app.on('ready', function() {
  'use strict';

  // No menu bar
  Menu.setApplicationMenu(null);

  elevate.require(app, function(error) {

    if (error) {
      throw error;
    }

    var mainWindow = ElectronWindow.createWindow({
      width: 800,
      height: 380,
      resizable: false,
      fullscreen: false,
      icon: path.join(__dirname, '..', 'assets', 'icon.png')
    });

    globalShortcut.register('CmdOrCtrl+Alt+I', function() {
      mainWindow.openDevTools();
    });

    mainWindow.showUrl(path.join(__dirname, 'index.html'));
  });
});

