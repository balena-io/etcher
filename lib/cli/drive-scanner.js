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

const drivelist = require('drivelist');
const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const Rx = require('rx');

/**
 * Interval between polls
 * @type {number}
 * @private
 */
const SCAN_INTERVAL = process.env.NODE_ENV === 'test' ? 10 : 2000;

/**
 * Stream of drives events.
 * @type {Observable}
 * @private
 */
const drivesStream = Rx.Observable.timer(0, SCAN_INTERVAL)
  .flatMap(() => {
    return Rx.Observable.fromNodeCallback(drivelist.list)();
  })
  .pausable(new Rx.Subject());

/**
 * The array of drives available at the last poll
 * @type {Object[]}
 * @private
 */
let previousDrives = null;

/**
 * @summary EventEmitter emitting when drives change
 * @namespace scanner
 * @public
 * @type {EventEmitter}
 * @description
 * This `EventEmitter` instance emits the `change` event when the available drives change.
 * The OS is polled for drive changes every [interval]{@link scanner#interval} ms.
 *
 * An event will be emitted immediately after calling [start]{@link scanner#start} and afterwards
 * whenever drive changes are detected, until [stop]{@link scanner#stop} is called.
 *
 * The event listener will be called with an array of available drives, and an array of drives
 * that were available in the previous scan. If it's the first emitted event after starting or
 * re-starting the emitter, the listener is called with the previous available drives set to `null`.
 *
 * @example
 * scanner = require('./drive-scanner');
 *
 * scanner.on('change', (currentDrives, previousDrives) => {
 *   console.log(currentDrives , previousDrives);
 * }
 *
 * // Start emitting events
 * scanner.start()
 *
 * // Stop emitting events
 * scanner.stop()
 */
module.exports = Object.create(new EventEmitter(), {

  /**
   * Interval between OS drives poll
   * @type number
   * @instance
   * @public
   * @readonly
   * @memberOf scanner
   */
  interval: {
    get: () => {
      return SCAN_INTERVAL;
    }
  },

  /**
   * Start emitting events
   * @method
   * @public
   * @memberOf scanner
   * @instance
   */
  start: {
    value: () => {
      drivesStream.resume();
    }
  },

  /**
   * Stop emitting events
   * @method
   * @public
   * @memberOf scanner
   * @instance
   */
  stop: {
    value: () => {
      previousDrives = null;
      drivesStream.pause();
    }
  }
});

drivesStream.subscribe((drives) => {
  if (previousDrives !== null && _.isEqual(drives, previousDrives)) {
    return;
  }

  module.exports.emit('change', drives, previousDrives);
  previousDrives = drives;
});
