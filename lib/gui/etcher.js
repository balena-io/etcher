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
const _ = require('lodash')
const path = require('path')
const debug = require('debug')('gui:etcher')

let mainWindow = null
let isFlashing = false

// Listen for flash-state event & set it accordingly,
// to prevent premature exit during a flash, leaving time
// for cleanup (i.e. termination of the child-writer)
electron.ipcMain.on('flash-state', (event, flashState) => {
  isFlashing = flashState
  debug('flash-state', isFlashing)
})

/**
 * @summary Handle termination situations (window close, quit, crash)
 * @private
 * @param {Event} event - before-quit event
 * @example
 * electron.app.on('before-quit', onBeforeQuit)
 */
const onBeforeQuit = (event) => {
  // If the window's webContents have crashed, exit immediately
  // NOTE: This happens when killing Etcher via Ctrl+C in the terminal
  if (mainWindow && mainWindow.webContents.isCrashed()) {
    debug('window:crashed')
    electron.app.exit()
  }

  // If we're flashing an image while quitting, signal the renderer
  // process, and prevent quitting for now to ensure the renderer process
  // can initiate & complete cleanup actions.
  // The renderer process will then call `electron.app.quit()` once
  // cleanup is done, and cause the exit to conclude.
  debug('isFlashing', isFlashing)
  if (isFlashing && mainWindow) {
    event.preventDefault()
    mainWindow.webContents.send('confirm-before-quit')
  }
}

electron.app.on('before-quit', onBeforeQuit)

electron.app.on('ready', () => {
  // No menu bar
  electron.Menu.setApplicationMenu(null)

  mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 380,
    useContentSize: true,
    show: false,
    resizable: false,
    fullscreen: false,
    titleBarStyle: 'hidden-inset',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.png')
  })

  // Prevent flash of white when starting the application
  mainWindow.on('ready-to-show', mainWindow.show)

  // NOTE: Because Ctrl+C (SIGINT) handling is pretty fickle in Electron,
  // if a `beforeunload` window event handler is registered,
  // and can cause a crashed webContents (displaying blank contents) to remain,
  // we attempt to force-close & quit if it's crashed.
  // See https://github.com/electron/electron/issues/5273
  mainWindow.webContents.on('crashed', onBeforeQuit)

  mainWindow.on('close', onBeforeQuit)

  mainWindow.on('closed', () => {
    debug('window:closed')
    mainWindow = null
  })

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
        mode: 'detach'
      })
    })

    // Disable refreshing the browser window
    // This is supposed to be handled by the `will-navigate`
    // event, however there seems to be an issue where such
    // event is not fired in macOS
    // See: https://github.com/electron/electron/issues/8841
    electron.globalShortcut.register('CmdOrCtrl+R', _.noop)
    electron.globalShortcut.register('F5', _.noop)
  })

  mainWindow.on('blur', () => {
    electron.globalShortcut.unregisterAll()
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
