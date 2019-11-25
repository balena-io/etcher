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
const MODULE_NAME = 'Etcher.Pages.Main'

require('angular-moment')

const MainPage = angular.module(MODULE_NAME, [
  'angularMoment',

  require('angular-ui-router'),
  require('angular-seconds-to-date'),

  require('../../components/drive-selector/drive-selector'),
  require('../../components/tooltip-modal/tooltip-modal'),
  require('../../components/flash-error-modal/flash-error-modal'),
  require('../../components/progress-button'),
  require('../../components/image-selector'),
  require('../../components/warning-modal/warning-modal'),
  require('../../components/file-selector'),
  require('../../components/featured-project'),
  require('../../components/reduced-flashing-infos'),
  require('../../components/flash-another/index.ts').MODULE_NAME,
  require('../../components/flash-results/index.ts').MODULE_NAME,
  require('../../components/drive-selector'),

  require('../../os/open-external/open-external'),
  require('../../os/dropzone/dropzone'),

  require('../../utils/byte-size/byte-size'),
  require('../../utils/middle-ellipsis/filter')
])

MainPage.controller('MainController', require('./controllers/main'))
MainPage.controller('ImageSelectionController', require('./controllers/image-selection'))
MainPage.controller('DriveSelectionController', require('./controllers/drive-selection'))
MainPage.controller('FlashController', require('./controllers/flash'))

MainPage.config(($stateProvider) => {
  $stateProvider
    .state('main', {
      url: '/main',
      controller: 'MainController as main',
      template: require('./templates/main.tpl.html')
    })
})

module.exports = MODULE_NAME
