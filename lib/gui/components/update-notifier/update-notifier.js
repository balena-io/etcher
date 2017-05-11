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
 * @module Etcher.Components.UpdateNotifier
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Components.UpdateNotifier';
const UpdateNotifier = angular.module(MODULE_NAME, [
  require('../modal/modal'),
  require('../../os/open-external/open-external')
]);

/**
 * @summary The number of days the update notifier can be put to sleep
 * @constant
 * @private
 * @type {Number}
 */
const UPDATE_NOTIFIER_SLEEP_DAYS = 7;

UpdateNotifier.constant('UPDATE_NOTIFIER_SLEEP_DAYS', UPDATE_NOTIFIER_SLEEP_DAYS);
UpdateNotifier.controller('UpdateNotifierController', require('./controllers/update-notifier'));
UpdateNotifier.service('UpdateNotifierService', require('./services/update-notifier'));

module.exports = MODULE_NAME;
