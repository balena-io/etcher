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
 * @module Etcher.Modules.DriveScanner
 */

const Rx = require('rx');
const os = require('os');
const _ = require('lodash');
const angular = require('angular');
const EventEmitter = require('events').EventEmitter;
const drivelist = require('drivelist');

const MODULE_NAME = 'Etcher.Modules.DriveScanner';
const driveScanner = angular.module(MODULE_NAME, [
  require('../models/settings')
]);

driveScanner.factory('DriveScannerService', (SettingsModel) => {
  const DRIVE_SCANNER_INTERVAL_MS = 2000;
  const emitter = new EventEmitter();

  const availableDrives = Rx.Observable.timer(0, DRIVE_SCANNER_INTERVAL_MS)
    .flatMap(() => {
      return Rx.Observable.fromNodeCallback(drivelist.list)();
    })
    .map((drives) => {

      // Calculate an appropriate "display name"
      drives = _.map(drives, (drive) => {
        drive.name = drive.device;

        if (os.platform() === 'win32' && drive.mountpoint) {
          drive.name = drive.mountpoint;
        }

        return drive;
      });

      if (SettingsModel.get('unsafeMode')) {
        return drives;
      }

      return _.reject(drives, (drive) => {
        return drive.system;
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
  availableDrives.subscribe((drives) => {
    emitter.emit('drives', drives);
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
    availableDrives.resume();
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
    availableDrives.pause();
  };

  return emitter;
});

module.exports = MODULE_NAME;
