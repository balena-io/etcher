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
 * @module Etcher.controllers.finish
 */

const angular = require('angular');

require('angular-ui-router');
require('../modules/selection-state');
require('../modules/settings');
require('../modules/image-writer');
require('../modules/analytics');
const finish = angular.module('Etcher.controllers.finish', [
  'ui.router',
  'Etcher.selection-state',
  'Etcher.settings',
  'Etcher.image-writer',
  'Etcher.analytics'
]);

finish.controller('FinishController', function(
  $state,
  SelectionStateService,
  SettingsService,
  ImageWriterService,
  AnalyticsService
) {

  /**
   * @summary Saved settings
   * @type Object
   * @public
   */
  this.settings = SettingsService.data;

  /**
   * @summary Restart the burning process
   * @function
   * @public
   *
   * @param {Object} [options] - options
   * @param {Boolean} [options.preserveImage=false] - preserve image
   *
   * @example
   * FinishController.restart({ preserveImage: true });
   */
  this.restart = function(options) {
    SelectionStateService.clear(options);
    ImageWriterService.resetState();
    AnalyticsService.logEvent('Restart', options);
    $state.go('main');
  };

});
