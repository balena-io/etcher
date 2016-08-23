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
const WiFi = require('../../cli/modules/visuals/widgets/wifi/index');

const MODULE_NAME = 'Etcher.Modules.TestScanner';
const testScanner = angular.module(MODULE_NAME, [
  require('../models/settings')
]);

testScanner.factory('WiFiScannerService', (SettingsModel) => {
  const RELEASE_SCANNER_INTERVAL_MS = 5000;
  const emitter = new EventEmitter();

  const availableWifiConnections = Rx.Observable.timer(0, RELEASE_SCANNER_INTERVAL_MS)
    .flatMap(() => {

      return Rx.Observable.fromPromise(WiFi.getConnections().then((connections) => {

        // Add a not in this list option
        connections.push({'ssid': '? not in this list'}) 
        return connections;
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
  availableWifiConnections.subscribe((connections) => {
    emitter.emit('connections', connections);
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
    availableWifiConnections.resume();
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
    availableWifiConnections.pause();
  };

  return emitter;
});

module.exports = MODULE_NAME;
