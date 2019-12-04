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

/**
 * This page represents the application main page.
 *
 * @module Etcher.Pages.Main
 */

const angular = require('angular')
const { react2angular } = require('react2angular')
const MODULE_NAME = 'Etcher.Pages.Main'

const MainPage = angular.module(MODULE_NAME, [
  require('angular-ui-router'),

  require('../../components/drive-selector/drive-selector'),
  require('../../components/image-selector'),
  require('../../components/file-selector'),
  require('../../components/featured-project'),
  require('../../components/reduced-flashing-infos'),
  require('../../components/flash-another'),
  require('../../components/flash-results'),
  require('../../components/drive-selector'),

  require('../../os/open-external/open-external'),

  require('../../utils/byte-size/byte-size'),
  require('../../utils/middle-ellipsis/filter')
])

MainPage.controller('MainController', require('./controllers/main'))
MainPage.component('driveSelector', react2angular(require('./DriveSelector.jsx'),
  [
    'webviewShowing',
    'disabled',
    'nextStepDisabled',
    'hasDrive',
    'flashing'
  ],
  [ 'DriveSelectorService' ]
))
MainPage.component('flash', react2angular(require('./Flash.jsx'),
  [ 'shouldFlashStepBeDisabled', 'lastFlashErrorCode', 'progressMessage' ],
  [ '$timeout', '$state', 'DriveSelectorService' ]))

MainPage.config(($stateProvider) => {
  $stateProvider
    .state('main', {
      url: '/main',
      controller: 'MainController as main',
      template: require('./templates/main.tpl.html')
    })
})

module.exports = MODULE_NAME
