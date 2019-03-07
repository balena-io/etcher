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
const buildWindowMenu = require('./menu')
const settings = require('./app/models/settings')
const {
  autoUpdater
} = require('electron-updater')
/* eslint-disable lodash/prefer-lodash-method */

const config = settings.getDefaults()

/**
 * @summary Create Etcher's main window
 * @example
 * electron.app.on('ready', createMainWindow)
 */
const createMainWindow = () => {
  const mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 480,
    useContentSize: true,
    show: false,
    resizable: Boolean(config.fullscreen),
    maximizable: false,
    fullscreen: Boolean(config.fullscreen),
    fullscreenable: Boolean(config.fullscreen),
    kiosk: Boolean(config.fullscreen),
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
    darkTheme: true,
    webPreferences: {
      backgroundThrottling: false
    }
  })

  buildWindowMenu(mainWindow)

  // Prevent flash of white when starting the application
  mainWindow.on('ready-to-show', () => {
    console.timeEnd('ready-to-show')
    mainWindow.show()
  })

  // Prevent the user from being allowed to zoom-in the application.
  //
  // This function should be called on the renderer process. We use
  // `executeJavaScript()` rather than moving this to a file in the
  // renderer process for convenience, since we have all other
  // electron desktop experience fixes in this file.
  //
  // See https://github.com/electron/electron/issues/3609
  mainWindow.webContents.executeJavaScript('require(\'electron\').webFrame.setVisualZoomLevelLimits(1, 1);')

  // Prevent external resources from being loaded (like images)
  // when dropping them on the WebView.
  // See https://github.com/electron/electron/issues/5919
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  const dir = __dirname.split(path.sep).pop()

  if (dir === 'generated') {
    mainWindow.loadURL(`file://${path.join(__dirname, '..', 'lib', 'gui', 'app', 'index.html')}`)
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, 'app', 'index.html')}`)
  }

  const page = mainWindow.webContents
  console.log('setting updater')

  page.once('did-frame-finish-load', () => {
    autoUpdater.on('checking-for-update', () => {
      electron.dialog.showMessageBox({
        type: 'info',
        title: 'checking-for-update',
        message: 'checking-for-update',
        buttons: ['Sure', 'No']
      }, () => {
        console.log('bye')
      })
    })
    autoUpdater.on('update-available', (info) => {
      console.log('update-available', info)
    })
    autoUpdater.on('update-not-available', (info) => {
      console.log('update-not-available', info)
    })
    autoUpdater.on('error', (err) => {
      console.log('error', err)
    })
    autoUpdater.checkForUpdatesAndNotify()
  })
}

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

settings.load().then((localSettings) => {
  Object.assign(config, localSettings)
}).catch((error) => {
  // TODO: What do if loading the config fails?
  console.error('Error loading settings:')
  console.error(error)
}).finally(() => {
  if (electron.app.isReady()) {
    createMainWindow()
  } else {
    electron.app.on('ready', createMainWindow)
  }
})

console.time('ready-to-show')
