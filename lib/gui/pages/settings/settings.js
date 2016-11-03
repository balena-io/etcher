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
 * @module Etcher.Pages.Settings
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Pages.Settings';
const SettingsPage = angular.module(MODULE_NAME, [
  require('angular-ui-router'),
  require('../../components/warning-modal/warning-modal'),
  require('../../models/settings')
]);

SettingsPage.controller('SettingsController', require('./controllers/settings'));

SettingsPage.config(($stateProvider) => {
  $stateProvider
    .state('settings', {
      url: '/settings',
      controller: 'SettingsController as settings',
      templateUrl: './pages/settings/templates/settings.tpl.html'
    });
});

module.exports = MODULE_NAME;
