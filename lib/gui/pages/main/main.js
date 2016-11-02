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

'use strict';

/**
 * @module Etcher.Pages.Main
 *
 * The finish page represents the application main page.
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Pages.Main';

const MainPage = angular.module(MODULE_NAME, [
  require('angular-ui-router'),
  require('angular-moment'),
  require('angular-middle-ellipses'),
  require('angular-seconds-to-date'),

  require('../../components/drive-selector/drive-selector'),
  require('../../components/tooltip-modal/tooltip-modal'),
  require('../../components/flash-error-modal/flash-error-modal'),
  require('../../components/progress-button/progress-button'),

  require('../../os/window-progress/window-progress'),
  require('../../os/notification/notification'),
  require('../../os/dialog/dialog'),
  require('../../os/open-external/open-external'),
  require('../../os/dropzone/dropzone'),

  require('../../modules/drive-scanner'),
  require('../../modules/image-writer'),
  require('../../modules/analytics'),
  require('../../modules/error'),
  require('../../models/selection-state'),
  require('../../models/flash-state'),
  require('../../models/settings'),
  require('../../models/supported-formats'),
  require('../../models/drives'),

  require('../../utils/path/path'),
  require('../../utils/byte-size/byte-size')
]);

MainPage.controller('MainController', require('./controllers/main'));
MainPage.controller('ImageSelectionController', require('./controllers/image-selection'));
MainPage.controller('DriveSelectionController', require('./controllers/drive-selection'));
MainPage.controller('FlashController', require('./controllers/flash'));

MainPage.config(($stateProvider) => {
  $stateProvider
    .state('main', {
      url: '/main',
      controller: 'MainController as main',
      templateUrl: './pages/main/templates/main.tpl.html'
    });
});

module.exports = MODULE_NAME;
