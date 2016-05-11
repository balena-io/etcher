/*
 * Copyright 2016 Resin.io
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
 * @module Etcher.Models.Settings
 */

const angular = require('angular');
require('ngstorage');
const MODULE_NAME = 'Etcher.Models.Settings';
const SettingsModel = angular.module(MODULE_NAME, [
  'ngStorage'
]);

SettingsModel.service('SettingsModel', function($localStorage) {

  /**
   * @summary Settings data
   * @type Object
   * @public
   */
  this.data = $localStorage.$default({
    errorReporting: true,
    unmountOnSuccess: true,
    validateWriteOnSuccess: true,
    sleepUpdateCheck: false
  });

});

module.exports = MODULE_NAME;
