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

/**
 * This page represents the application flashing progress page.
 *
 * @module Etcher.Pages.Progress
 */

const angular = require('angular')
const react2angular = require('react2angular').react2angular
const ProgressPage = require('./components/progress')

const MODULE_NAME = 'Etcher.Pages.Progress'

require('angular-moment')

const angularProgressPage = angular.module(MODULE_NAME, [
  'angularMoment',

  require('angular-ui-router'),
  require('angular-middle-ellipses'),
  require('angular-seconds-to-date'),

  require('../../components/tooltip-modal/tooltip-modal'),
  require('../../components/flash-error-modal/flash-error-modal'),
  require('../../components/progress-button/progress-button'),

  require('../../modules/image-writer'),

  require('../../utils/byte-size/byte-size')
])

angularProgressPage.controller('ProgressController', require('./controllers/progress'))

angularProgressPage.component('progressPage', react2angular(ProgressPage))

angularProgressPage.config(($stateProvider) => {
  $stateProvider
    .state('progress', {
      url: '/progress',
      controller: 'ProgressController as progress',
      templateUrl: './pages/progress/templates/progress.tpl.html'
    })
})

module.exports = MODULE_NAME
