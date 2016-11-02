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

const electron = require('electron');
const path = require('path');
let mainWindow = null;

electron.app.on('window-all-closed', electron.app.quit);

electron.app.on('ready', () => {

  // No menu bar
  electron.Menu.setApplicationMenu(null);

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
  mainWindow.webContents.on('did-finish-load', () => {

    // The flash of white is still present for a very short
    // while after the WebView reports it finished loading
    setTimeout(() => {
      mainWindow.show();
    }, 100);

  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // For some reason, Electron shortcuts are registered
  // globally, which means that the app listers for shorcuts
  // even if its not currently focused, potentially interferring
  // with shorcuts registered by other applications.
  // As a workaround, we register all shortcuts when the windows
  // gains focus, and unregister them when the windows loses focus.
  // See http://electron.atom.io/docs/api/global-shortcut/

  mainWindow.on('focus', () => {
    electron.globalShortcut.register('CmdOrCtrl+Alt+I', () => {
      mainWindow.webContents.openDevTools({
        mode: 'undocked'
      });
    });
  });

  mainWindow.on('blur', () => {
    electron.globalShortcut.unregisterAll();
  });

  // Prevent the user from being allowed to zoom-in the application.
  //
  // This function should be called on the renderer process. We use
  // `executeJavaScript()` rather than moving this to a file in the
  // renderer process for convenience, since we have all other
  // electron desktop experience fixes in this file.
  //
  // See https://github.com/electron/electron/issues/3609
  mainWindow.webContents.executeJavaScript('require(\'electron\').webFrame.setZoomLevelLimits(1, 1);');

  // Prevent external resources from being loaded (like images)
  // when dropping them on the WebView.
  // See https://github.com/electron/electron/issues/5919
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
});

