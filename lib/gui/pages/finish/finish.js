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
 * @module Etcher.Pages.Finish
 *
 * The finish page represents the application state where
 * the the flash/validation has completed.
 *
 * Its purpose is to display success or failure information,
 * as well as the "next steps".
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Pages.Finish';
const FinishPage = angular.module(MODULE_NAME, [
  require('angular-ui-router'),
  require('../../modules/analytics'),
  require('../../models/flash-state'),
  require('../../models/selection-state'),
  require('../../models/settings')
]);

FinishPage.controller('FinishController', require('./controllers/finish'));

FinishPage.config(($stateProvider) => {
  $stateProvider
    .state('success', {
      url: '/success',
      controller: 'FinishController as finish',
      templateUrl: './pages/finish/templates/success.tpl.html'
    });
});

module.exports = MODULE_NAME;
