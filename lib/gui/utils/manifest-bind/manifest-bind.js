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
 * @module Etcher.Utils.ManifestBind
 *
 * The purpose of this module is to provide an attribute
 * directive to bind the current element to a property
 * in the application's `package.json` manifest.
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Utils.ManifestBind';
const ManifestBind = angular.module(MODULE_NAME, []);
ManifestBind.service('ManifestBindService', require('./services/manifest-bind'));
ManifestBind.directive('manifestBind', require('./directives/manifest-bind'));

module.exports = MODULE_NAME;
