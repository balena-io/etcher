/*
 * Copyright 2017 balena.io
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
const settings = require('../models/settings')

/**
 * @summary Send a notification
 * @function
 * @public
 *
 * @description
 * This function makes use of Electron's notification desktop
 * integration feature. See:
 * http://electron.atom.io/docs/v0.37.5/tutorial/desktop-environment-integration/
 *
 * @param {String} title - notification title
 * @param {Object} options - options object
 * @param {String} options.body - notification body
 * @param {String} options.icon - supported icon path
 * @returns {Object} HTML5 notification instance
 *
 * @example
 * notification.send('Hello', {
 *   body: 'Foo Bar Bar',
 *   icon: 'icon.png'
 * });
 */
exports.send = (title, options) => {
  // Bail out if desktop notifications are disabled
  if (!settings.get('desktopNotifications')) {
    return null
  }

  // `app.dock` is only defined in OS X
  if (electron.remote.app.dock) {
    electron.remote.app.dock.bounce()
  }

  return new window.Notification(title, options)
}
