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
 * @module Etcher.Models.SelectionState
 */

const _ = require('lodash');
const angular = require('angular');
const SelectionStateModel = angular.module('Etcher.Models.SelectionState', []);

SelectionStateModel.service('SelectionStateModel', function() {
  let self = this;

  /**
   * @summary Selection state
   * @type Object
   * @private
   */
  let selection = {};

  /**
   * @summary Set a drive
   * @function
   * @public
   *
   * @param {Object} drive - drive
   *
   * @example
   * SelectionStateModel.setDrive({
   *   device: '/dev/disk2'
   * });
   */
  this.setDrive = function(drive) {
    selection.drive = drive;
  };

  /**
   * @summary Set a image
   * @function
   * @public
   *
   * @param {String} image - image
   *
   * @example
   * SelectionStateModel.setImage('foo.img');
   */
  this.setImage = function(image) {
    selection.image = image;
  };

  /**
   * @summary Get drive
   * @function
   * @public
   *
   * @returns {Object} drive
   *
   * @example
   * const drive = SelectionStateModel.getDrive();
   */
  this.getDrive = function() {
    return selection.drive;
  };

  /**
   * @summary Get image
   * @function
   * @public
   *
   * @returns {String} image
   *
   * @example
   * const image = SelectionStateModel.getImage();
   */
  this.getImage = function() {
    return selection.image;
  };

  /**
   * @summary Check if there is a selected drive
   * @function
   * @public
   *
   * @returns {Boolean} whether there is a selected drive
   *
   * @example
   * if (SelectionStateModel.hasDrive()) {
   *   console.log('There is a drive!');
   * }
   */
  this.hasDrive = function() {
    return Boolean(self.getDrive());
  };

  /**
   * @summary Check if there is a selected image
   * @function
   * @public
   *
   * @returns {Boolean} whether there is a selected image
   *
   * @example
   * if (SelectionStateModel.hasImage()) {
   *   console.log('There is an image!');
   * }
   */
  this.hasImage = function() {
    return Boolean(self.getImage());
  };

  /**
   * @summary Remove drive
   * @function
   * @public
   *
   * @example
   * SelectionStateModel.removeDrive();
   */
  this.removeDrive = _.partial(self.setDrive, undefined);

  /**
   * @summary Remove image
   * @function
   * @public
   *
   * @example
   * SelectionStateModel.removeImage();
   */
  this.removeImage = _.partial(self.setImage, undefined);

  /**
   * @summary Clear selections
   * @function
   * @public
   *
   * @param {Object} options - options
   * @param {Boolean} [options.preserveImage] - preserve image
   *
   * @example
   * SelectionStateModel.clear();
   *
   * @example
   * SelectionStateModel.clear({ preserveImage: true });
   */
  this.clear = function(options) {
    if (options && options.preserveImage) {
      selection = _.pick(selection, 'image');
    } else {
      selection = {};
    }
  };

  /**
   * @summary Check if a drive is the current drive
   * @function
   * @public
   *
   * @param {Object} drive - drive
   * @returns {Boolean} whether the drive is the current drive
   *
   * @example
   * if (SelectionStateModel.isCurrentDrive({
   *   device: '/dev/sdb',
   *   description: 'DataTraveler 2.0',
   *   size: '7.3G',
   *   mountpoint: '/media/UNTITLED',
   *   name: '/dev/sdb',
   *   system: false
   * })) {
   *   console.log('This is the current drive!');
   * }
   */
  this.isCurrentDrive = function(drive) {
    return angular.equals(self.getDrive(), drive);
  };

});
