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
 * @module Etcher.Components.KiOSSelector
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Components.KiOSSelector';
const KiOSSelector = angular.module(MODULE_NAME, [
  require('angular-ui-bootstrap'),

  require('../../models/kios'),
  require('../../models/selection-state'),
  require('../../utils/byte-size/byte-size'),
  require('angular-material'),
  require('angular-aria'),
  require('angular-animate'),
])
.config(function($mdThemingProvider) {
  $mdThemingProvider.definePalette('kiosPallete', {
    '50': 'a2a2a2',
    '100': 'a2a2a2',
    '200': 'a2a2a2',
    '300': 'a2a2a2',
    '400': 'a2a2a2',
    '500': 'a2a2a2',
    '600': 'a2a2a2',
    '700': 'a2a2a2',
    '800': 'a2a2a2',
    '900': 'a2a2a2',
    'A100': 'a2a2a2',
    'A200': 'a2a2a2',
    'A400': 'ff1744',
    'A700': 'a2a2a2',
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50', '100', '200', '300', '400', 'A100'],
    'contrastLightColors': undefined
  });
  $mdThemingProvider.theme('default')
    .primaryPalette('kiosPallete')
});

KiOSSelector.controller('KiOSSelectorController', require('./controllers/kios-selector'));
KiOSSelector.service('KiOSSelectorService', require('./services/kios-selector'));

module.exports = MODULE_NAME;