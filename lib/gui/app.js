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

/**
 * @module Etcher
 */

'use strict';

/* eslint-disable no-var */

var angular = require('angular');

/* eslint-enable no-var */

const Store = require('./models/store');

const app = angular.module('Etcher', [
  require('angular-ui-router'),
  require('angular-ui-bootstrap'),
  require('angular-if-state'),

  // Etcher modules
  require('./modules/analytics'),

  // Models
  require('./models/selection-state'),
  require('./models/flash-state'),

  // Components
  require('./components/svg-icon/svg-icon'),
  require('./components/update-notifier/update-notifier'),

  // Pages
  require('./pages/main/main'),
  require('./pages/finish/finish'),
  require('./pages/settings/settings'),

  // OS
  require('./os/window-progress/window-progress'),
  require('./os/open-external/open-external'),

  // Utils
  require('./utils/manifest-bind/manifest-bind')
]);

app.run((AnalyticsService, UpdateNotifierService, SelectionStateModel) => {
  AnalyticsService.logEvent('Application start');

  if (UpdateNotifierService.shouldCheckForUpdates()) {
    AnalyticsService.logEvent('Checking for updates');

    UpdateNotifierService.isLatestVersion().then((isLatestVersion) => {

      // In case the internet connection is not good and checking the
      // latest published version takes too long, only show notify
      // the user about the new version if he didn't start the flash
      // process (e.g: selected an image), otherwise such interruption
      // might be annoying.
      if (!isLatestVersion && !SelectionStateModel.hasImage()) {

        AnalyticsService.logEvent('Notifying update');
        UpdateNotifierService.notify();
      }
    });
  }

});

app.run((AnalyticsService, OSWindowProgressService, FlashStateModel) => {
  Store.subscribe(() => {
    const flashState = FlashStateModel.getFlashState();

    // There is usually a short time period between the `isFlashing()`
    // property being set, and the flashing actually starting, which
    // might cause some non-sense flashing state logs including
    // `undefined` values.
    //
    // We use the presence of `.eta` to determine that the actual
    // writing started.
    if (!FlashStateModel.isFlashing() || !flashState.eta) {
      return;
    }

    AnalyticsService.log([
      `Progress (${flashState.type}):`,
      `${flashState.percentage}% at ${flashState.speed} MB/s`,
      `(eta ${flashState.eta}s)`
    ].join(' '));

    OSWindowProgressService.set(flashState.percentage);
  });
});

app.config(($urlRouterProvider) => {
  $urlRouterProvider.otherwise('/main');
});
