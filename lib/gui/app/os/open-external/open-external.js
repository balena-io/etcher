/*
 * Copyright 2016 balena.io
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

/**
 * @module Etcher.OS.OpenExternal
 */

const angular = require('angular')
const url = require('url')

const MODULE_NAME = 'Etcher.OS.OpenExternal'
const OSOpenExternal = angular.module(MODULE_NAME, [])
OSOpenExternal.service('OSOpenExternalService', require('./services/open-external'))
OSOpenExternal.directive('osOpenExternal', require('./directives/open-external'))

OSOpenExternal.run((OSOpenExternalService) => {
  document.addEventListener('click', (event) => {
    const target = event.target
    if (target.tagName === 'A' && angular.isDefined(target.href)) {
      // Electron interprets relative URLs as being relative to the
      // current loaded URL (with `webContents.loadURL`) and expands
      // them to the corresponding absolute URL. If it's a `file://`
      // URL, we don't want it opened in an external browser.
      if (url.parse(target.href).protocol !== 'file:') {
        OSOpenExternalService.open(target.href)
      }
    }
  })
})

module.exports = MODULE_NAME
