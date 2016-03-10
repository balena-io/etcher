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
 * @module Etcher.controllers.navigation
 */

const electron = require('electron');
const shell = electron.remote.require('shell');
const angular = require('angular');

require('angular-ui-router');
const navigation = angular.module('Etcher.controllers.navigation', [
  'ui.router'
]);

navigation.controller('NavigationController', function($state) {

  /**
   * @summary Check the current state
   * @function
   * @public
   *
   * @param {String} state - state
   * @returns {Boolean} whether the state matches
   *
   * @example
   * if(NavigationController.isState('state')) {
   *   console.log('We are in this state').
   * }
   */
  this.isState = $state.is;

  /**
   * @summary Open external resource
   * @function
   * @public
   *
   * @param {String} resource - resource
   *
   * @example
   * NavigationController.open('https://google.com');
   */
  this.open = shell.openExternal;

});
