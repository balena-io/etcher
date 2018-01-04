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

'use strict'

const electron = require('electron')
const path = require('path')
const EXIT_CODES = require('../shared/exit-codes')
let mainWindow = null

electron.app.on('window-all-closed', electron.app.quit)

// Sending a `SIGINT` (e.g: Ctrl-C) to an Electron app that registers
// a `beforeunload` window event handler results in a disconnected white
// browser window in GNU/Linux and macOS.
// The `before-quit` Electron event is triggered in `SIGINT`, so we can
// make use of it to ensure the browser window is completely destroyed.
// See https://github.com/electron/electron/issues/5273
electron.app.on('before-quit', () => {
  process.exit(EXIT_CODES.SUCCESS)
})

electron.app.on('ready', () => {
  electron.Menu.setApplicationMenu(require('./menu'))

  mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 380,
    useContentSize: true,
    show: false,
    resizable: false,
    maximizable: false,
    fullscreen: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden-inset',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.png')
  })

  // Prevent flash of white when starting the application
  mainWindow.on('ready-to-show', mainWindow.show)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Prevent the user from being allowed to zoom-in the application.
  //
  // This function should be called on the renderer process. We use
  // `executeJavaScript()` rather than moving this to a file in the
  // renderer process for convenience, since we have all other
  // electron desktop experience fixes in this file.
  //
  // See https://github.com/electron/electron/issues/3609
  mainWindow.webContents.executeJavaScript('require(\'electron\').webFrame.setZoomLevelLimits(1, 1);')

  // Prevent external resources from being loaded (like images)
  // when dropping them on the WebView.
  // See https://github.com/electron/electron/issues/5919
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`)
})
