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
 * @module Etcher.Models.KiOS
 */

const angular = require('angular');
const _ = require('lodash');
const Store = require('./store');
const MODULE_NAME = 'Etcher.Models.KiOS';
const KiOS = angular.module(MODULE_NAME, []);
const IP = require('../../cli/modules/visuals/widgets/network/ip');
const Gateway = require('../../cli/modules/visuals/widgets/network/gateway');
const Netmask = require('../../cli/modules/visuals/widgets/network/netmask');

KiOS.service('KiOSModel', function() {

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
  this.hasAvailableReleases = () => {
    return !_.isEmpty(this.getReleases());
  };

  this.hasAvailableConnections = () => {
    return !_.isEmpty(this.getConnections());
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
  this.setReleases = (releases) => {
    Store.dispatch({
      type: Store.Actions.SET_AVAILABLE_RELEASES,
      data: releases
    });
  };

  this.setConnections = (connections) => {
    Store.dispatch({
      type: Store.Actions.SET_AVAILABLE_CONNECTIONS,
      data: connections
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
   * @summary Get releases
   * @function
   * @private
   *
   * @returns {Object[]} releases
   *
   * @example
   * const releases = KiOSModel.getReleases();
   */

  this.getReleases = memoizeImmutableListReference(() => {
    return Store.getState().toJS().availableReleases;
  });

  this.getConnections = memoizeImmutableListReference(() => {
    return Store.getState().toJS().availableConnections;
  });

  /**
   * @summary Get network types
   * @function
   * @private
   *
   * @returns {Object[]} types
   *
   * @example
   * const types = KiOSModel.getNetworkTypes();
   */

  this.getNetworkTypes = memoizeImmutableListReference(() => {
    return [
      {
        'name': 'Ethernet (cable)',
        'value': 'eth'
      },
      {
        'name': 'WiFI (wireless)',
        'value': 'wifi'
      }
    ];
  });

  /**
   * @summary Get network types
   * @function
   * @private
   *
   * @returns {Object[]} types
   *
   * @example
   * const types = KiOSModel.getNetworkTypes();
   */

  this.getNetworkConfigurations = memoizeImmutableListReference(() => {
    return [
      {
        'name': 'dynamic IP address',
        'value': 'dynamic'
      },
      {
        'name': 'static IP address',
        'value': 'static'
      }
    ];
  });

  /**
   * @summary Get network types
   * @function
   * @private
   *
   * @returns {Object[]} types
   *
   * @example
   * const types = KiOSModel.getNetworkTypes();
   */

  this.initalizeConfiguration = () => {
    this.getAvailableIP();
    this.getSubnet();
    this.getGateway();
    this.getDNS();
  };

  this.getAvailableIP = () => {
    var self = this;
    return IP.getAvailableIP().then((ip) => {
        self.ip = ip;
    });
  };

  this.getSubnet = () => {
    this.netmask = '';
    
    var netmasks = Netmask.getNetmasks();
    if(netmasks.length > 0)
    {
      this.netmask = netmasks[0];
    }
  };

  this.getGateway = () => {
    this.gateway = Gateway.getGateway();
  };

  this.getDNS = () => {
    this.dns = '8.8.8.8';
  };

});

module.exports = MODULE_NAME;
