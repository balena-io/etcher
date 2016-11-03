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
 * @module Etcher.Models.Drives
 */

const angular = require('angular');
const _ = require('lodash');
const Store = require('./store');
const MODULE_NAME = 'Etcher.Models.Drives';
const Drives = angular.module(MODULE_NAME, []);

Drives.service('DrivesModel', function() {

  /**
   * @summary Check if there are available drives
   * @function
   * @public
   *
   * @returns {Boolean} whether there are available drives
   *
   * @example
   * if (DrivesModel.hasAvailableDrives()) {
   *   console.log('There are available drives!');
   * }
   */
  this.hasAvailableDrives = () => {
    return !_.isEmpty(this.getDrives());
  };

  /**
   * @summary Set a list of drives
   * @function
   * @private
   *
   * @param {Object[]} drives - drives
   *
   * @throws Will throw if no drives
   * @throws Will throw if drives is not an array of objects
   *
   * @example
   * DrivesModel.setDrives([ ... ]);
   */
  this.setDrives = (drives) => {
    Store.dispatch({
      type: Store.Actions.SET_AVAILABLE_DRIVES,
      data: drives
    });
  };

  // This workaround is needed to avoid AngularJS from getting
  // caught in an infinite digest loop when using `ngRepeat`
  // over a function that returns a mutable version of an
  // ImmutableJS object.
  //
  // The problem is that everytime you call `myImmutableObject.toJS()`
  // you will get a new object, whose reference is different from
  // the one you previously got, even if the data is exactly the same.
  const memoizeImmutableListReference = (func) => {
    let previous = [];

    return () => {
      const list = Reflect.apply(func, this, arguments);

      if (!_.isEqual(list, previous)) {
        previous = list;
      }

      return previous;
    };
  };

  /**
   * @summary Get detected drives
   * @function
   * @private
   *
   * @returns {Object[]} drives
   *
   * @example
   * const drives = DrivesModel.getDrives();
   */
  this.getDrives = memoizeImmutableListReference(() => {
    return Store.getState().toJS().availableDrives;
  });

});

module.exports = MODULE_NAME;
