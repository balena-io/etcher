/*
 * Copyright 2018 resin.io
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

/* eslint-disable jsdoc/require-example */

/**
 * @module Etcher.Components.SVGIcon
 */

const angular = require('angular')
const react2angular = require('react2angular').react2angular

const MODULE_NAME = 'Etcher.Components.FileSelector'
const angularFileSelector = angular.module(MODULE_NAME, [
  require('../modal/modal')
])

angularFileSelector.component('fileSelector', react2angular(require('./file-selector/file-selector.jsx')))
angularFileSelector.controller('FileSelectorController', require('./controllers/file-selector'))
angularFileSelector.service('FileSelectorService', require('./services/file-selector'))

module.exports = MODULE_NAME
