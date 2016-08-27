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
 * @module Etcher.Modules.DriveScanner
 */

const Rx = require('rx');
const _ = require('lodash');
const angular = require('angular');
const Bluebird = require('bluebird');
const EventEmitter = require('events').EventEmitter;
const drivelist = require('drivelist');
const Versions = require('../../cli/modules/visuals/widgets/kios/index');

const MODULE_NAME = 'Etcher.Modules.ReleaseScanner';
const releaseScanner = angular.module(MODULE_NAME, [
  require('../models/settings')
]);

releaseScanner.factory('ReleaseScannerService', (SettingsModel) => {
  const RELEASE_SCANNER_INTERVAL_MS = 10000;
  const emitter = new EventEmitter();

  const availableReleases = Rx.Observable.timer(0, RELEASE_SCANNER_INTERVAL_MS)
    .flatMap(() => {

      return Rx.Observable.fromPromise(Versions.getVersions().then((data) => {
        var versions = [];
        
        if(data)
        {
          versions = JSON.parse(data);
        }

        return versions;
    }));

    })
    .map((releases) => {
      if (SettingsModel.get('unsafeMode')) {
        return releases;
      }

      return _.reject(releases, (release) => {
        return release.system;
      });
    })
    .pausable(new Rx.Subject());

  /*
   * This service emits the following events:
   *
   * - `drives (Object[])`
   * - `error (Error)`
   *
   * For example:
   *
   * ```
   * DriveScannerService.on('drives', (drives) => {
   *   console.log(drives);
   * });
   *
   * DriveScannerService.on('error', (error) => {
   *   throw error;
   * });
   * ```
   */
  availableReleases.subscribe((releases) => {
    emitter.emit('releases', releases);
  }, (error) => {
    emitter.emit('error', error);
  });

  /**
   * @summary Start scanning drives
   * @function
   * @public
   *
   * @example
   * DriveScannerService.start();
   */
  emitter.start = () => {
    availableReleases.resume();
  };

  /**
   * @summary Stop scanning drives
   * @function
   * @public
   *
   * @example
   * DriveScannerService.stop();
   */
  emitter.stop = () => {
    availableReleases.pause();
  };

  return emitter;
});

module.exports = MODULE_NAME;
