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
 * @module Etcher.Components.UpdateNotifier
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Components.UpdateNotifier';
const UpdateNotifier = angular.module(MODULE_NAME, [
  require('angular-ui-bootstrap'),
  require('../../models/settings'),
  require('../../utils/manifest-bind/manifest-bind'),
  require('../../os/open-external/open-external')
]);

UpdateNotifier.constant('UPDATE_NOTIFIER_URL', 'https://resin-production-downloads.s3.amazonaws.com');
UpdateNotifier.constant('UPDATE_NOTIFIER_SLEEP_TIME', 7 * 24 * 60 * 60 * 100);
UpdateNotifier.controller('UpdateNotifierController', require('./controllers/update-notifier'));
UpdateNotifier.service('UpdateNotifierService', require('./services/update-notifier'));
UpdateNotifier.service('UpdateNotifierS3Service', require('./services/update-notifier-s3'));

module.exports = MODULE_NAME;
