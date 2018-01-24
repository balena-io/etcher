/*
 * Copyright 2017 resin.io
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
const packageJson = require('../../package.json')

const menuTemplate = [
  {
    role: 'editMenu'
  },
  {
    label: 'View',
    submenu: [
      {
        role: 'toggledevtools',
        click () {
          const window = electron.BrowserWindow.getFocusedWindow()
          if (window) {
            window.webContents.openDevTools({
              mode: 'detach'
            })
          }
        }
      }
    ]
  },
  {
    role: 'windowMenu'
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Etcher Pro',
        click () {
          electron.shell.openExternal('https://etcher.io/pro')
        }
      },
      {
        label: 'Etcher Website',
        click () {
          electron.shell.openExternal('https://etcher.io')
        }
      },
      {
        label: 'Report an issue',
        click () {
          electron.shell.openExternal('https://github.com/resin-io/etcher/issues')
        }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  menuTemplate.unshift({
    label: packageJson.displayName,
    submenu: [ {
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: 'Preferences',
      accelerator: 'Command+,',
      click () {
        const window = electron.BrowserWindow.getFocusedWindow()
        if (window) {
          window.webContents.send('menu:preferences')
        }
      }
    }, {
      type: 'separator'
    }, {
      role: 'hide'
    }, {
      role: 'hideothers'
    }, {
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      role: 'quit'
    } ]
  })
} else {
  menuTemplate.unshift({
    label: packageJson.displayName,
    submenu: [ {
      label: 'Settings',
      click () {
        const window = electron.BrowserWindow.getFocusedWindow()
        if (window) {
          window.webContents.send('menu:preferences')
        }
      }
    }, {
      role: 'quit'
    } ]
  })
}

module.exports = electron.Menu.buildFromTemplate(menuTemplate)
