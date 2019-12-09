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
const store = require('../../../models/store')
const analytics = require('../../../modules/analytics')
const settings = require('../../../models/settings')

/**
 * @summary Open an external resource
 * @function
 * @public
 *
 * @param {String} url - url
 *
 * @example
 * OSOpenExternalService.open('https://www.google.com');
 */
const open = (url) => {
  // Don't open links if they're disabled by the env var
  if (settings.get('disableExternalLinks')) {
    return
  }

  analytics.logEvent('Open external link', {
    url,
    applicationSessionUuid: store.getState().toJS().applicationSessionUuid
  })

  if (url) {
    electron.shell.openExternal(url)
  }
}

module.exports = function () {
  this.open = open
}

module.exports.open = open
