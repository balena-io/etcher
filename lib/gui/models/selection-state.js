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
const MODULE_NAME = 'Etcher.Models.SelectionState';
const SelectionStateModel = angular.module(MODULE_NAME, []);

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
   * @throws Will throw if drive lacks `.device`.
   * @throws Will throw if `drive.device` is not a string.
   * @throws Will throw if drive lacks `.name`.
   * @throws Will throw if `drive.name` is not a string.
   * @throws Will throw if drive lacks `.size`.
   * @throws Will throw if `drive.size` is not a number.
   *
   * @example
   * SelectionStateModel.setDrive({
   *   device: '/dev/disk2',
   *   name: 'USB drive',
   *   size: 999999999
   * });
   */
  this.setDrive = function(drive) {

    if (!drive.device) {
      throw new Error('Missing drive device');
    }

    if (!_.isString(drive.device)) {
      throw new Error(`Invalid drive device: ${drive.device}`);
    }

    if (!drive.name) {
      throw new Error('Missing drive name');
    }

    if (!_.isString(drive.name)) {
      throw new Error(`Invalid drive name: ${drive.name}`);
    }

    if (!drive.size) {
      throw new Error('Missing drive size');
    }

    if (!_.isNumber(drive.size)) {
      throw new Error(`Invalid drive size: ${drive.size}`);
    }

    selection.drive = drive;
  };

  /**
   * @summary Toggle set drive
   * @function
   * @public
   *
   * @param {Object} drive - drive
   *
   * @example
   * SelectionStateModel.toggleSetDrive({
   *   device: '/dev/disk2'
   * });
   */
  this.toggleSetDrive = function(drive) {
    if (self.isCurrentDrive(drive)) {
      self.removeDrive();
    } else {
      self.setDrive(drive);
    }
  };

  /**
   * @summary Set a image
   * @function
   * @public
   *
   * @param {Object} image - image
   *
   * @throws Will throw if image lacks `.path`.
   * @throws Will throw if `image.path` is not a string.
   * @throws Will throw if image lacks `.size`.
   * @throws Will throw if `image.size` is not a number.
   *
   * @example
   * SelectionStateModel.setImage({
   *   path: 'foo.img'
   * });
   */
  this.setImage = function(image) {

    if (!image.path) {
      throw new Error('Missing image path');
    }

    if (!_.isString(image.path)) {
      throw new Error(`Invalid image path: ${image.path}`);
    }

    if (!image.size) {
      throw new Error('Missing image size');
    }

    if (!_.isNumber(image.size)) {
      throw new Error(`Invalid image size: ${image.size}`);
    }

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
    if (_.isEmpty(selection.drive)) {
      return;
    }

    return selection.drive;
  };

  /**
   * @summary Get image path
   * @function
   * @public
   *
   * @returns {String} image path
   *
   * @example
   * const imagePath = SelectionStateModel.getImagePath();
   */
  this.getImagePath = function() {
    return _.get(selection.image, 'path');
  };

  /**
   * @summary Get image size
   * @function
   * @public
   *
   * @returns {Number} image size
   *
   * @example
   * const imageSize = SelectionStateModel.getImageSize();
   */
  this.getImageSize = function() {
    return _.get(selection.image, 'size');
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
    return Boolean(self.getImagePath() && self.getImageSize());
  };

  /**
   * @summary Remove drive
   * @function
   * @public
   *
   * @example
   * SelectionStateModel.removeDrive();
   */
  this.removeDrive = _.partial(_.unset, selection, 'drive');

  /**
   * @summary Remove image
   * @function
   * @public
   *
   * @example
   * SelectionStateModel.removeImage();
   */
  this.removeImage = _.partial(_.unset, selection, 'image');

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
    if (!drive || !drive.device) {
      return false;
    }

    return drive.device === _.get(self.getDrive(), 'device');
  };

});

module.exports = MODULE_NAME;
