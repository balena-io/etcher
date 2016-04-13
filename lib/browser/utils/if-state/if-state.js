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
 * @module Etcher.Utils.IfState
 *
 * The purpose of this module is to provide an attribute
 * directive to show/hide an element when the current UI Router
 * state matches the one specified in the attribute.
 */

const angular = require('angular');
require('angular-ui-router');

const MODULE_NAME = 'Etcher.Utils.IfState';
const IfState = angular.module(MODULE_NAME, [
  'ui.router'
]);

IfState.directive('showIfState', require('./directives/show-if-state'));
IfState.directive('hideIfState', require('./directives/hide-if-state'));

module.exports = MODULE_NAME;
