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
 * @module Etcher.Models.SelectionState
 */

const _ = require('lodash');
const angular = require('angular');
const Store = require('./store');
const availableDrives = require('./drives');
const MODULE_NAME = 'Etcher.Models.SelectionState';
const SelectionStateModel = angular.module(MODULE_NAME, []);

SelectionStateModel.service('SelectionStateModel', function() {

  /**
   * @summary Set a drive
   * @function
   * @public
   *
   * @param {String} drive - drive device
   *
   * @example
   * SelectionStateModel.setDrive('/dev/disk2');
   */
  this.setDrive = (drive) => {
    Store.dispatch({
      type: Store.Actions.SELECT_DRIVE,
      data: drive
    });
  };

  /**
   * @summary Toggle set drive
   * @function
   * @public
   *
   * @param {String} drive - drive device
   *
   * @example
   * SelectionStateModel.toggleSetDrive('/dev/disk2');
   */
  this.toggleSetDrive = (drive) => {
    if (this.isCurrentDrive(drive)) {
      this.removeDrive();
    } else {
      this.setDrive(drive);
    }
  };

  /**
   * @summary Set a image
   * @function
   * @public
   *
   * @param {Object} image - image
   *
   * @example
   * SelectionStateModel.setImage({
   *   path: 'foo.img'
   * });
   */
  this.setImage = (image) => {
    Store.dispatch({
      type: Store.Actions.SELECT_IMAGE,
      data: image
    });
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
  this.getDrive = () => {
    return _.find(availableDrives.getDrives(), {
      device: Store.getState().getIn([ 'selection', 'drive' ])
    });
  };

  /**
   * @summary Get the selected image
   * @function
   * @public
   *
   * @returns {Object} image
   *
   * @example
   * const image = SelectionStateModel.getImage();
   */
  this.getImage = () => {
    return _.get(Store.getState().toJS(), [ 'selection', 'image' ]);
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
  this.getImagePath = () => {
    return _.get(Store.getState().toJS(), [
      'selection',
      'image',
      'path'
    ]);
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
  this.getImageSize = () => {
    return _.get(Store.getState().toJS(), [
      'selection',
      'image',
      'size',
      'final',
      'value'
    ]);
  };

  /**
   * @summary Get image url
   * @function
   * @public
   *
   * @returns {String} image url
   *
   * @example
   * const imageUrl = SelectionStateModel.getImageUrl();
   */
  this.getImageUrl = () => {
    return _.get(Store.getState().toJS(), [
      'selection',
      'image',
      'url'
    ]);
  };

  /**
   * @summary Get image name
   * @function
   * @public
   *
   * @returns {String} image name
   *
   * @example
   * const imageName = SelectionStateModel.getImageName();
   */
  this.getImageName = () => {
    return _.get(Store.getState().toJS(), [
      'selection',
      'image',
      'name'
    ]);
  };

  /**
   * @summary Get image logo
   * @function
   * @public
   *
   * @returns {String} image logo
   *
   * @example
   * const imageLogo = SelectionStateModel.getImageLogo();
   */
  this.getImageLogo = () => {
    return _.get(Store.getState().toJS(), [
      'selection',
      'image',
      'logo'
    ]);
  };

  /**
   * @summary Get image support url
   * @function
   * @public
   *
   * @returns {String} image support url
   *
   * @example
   * const imageSupportUrl = SelectionStateModel.getImageSupportUrl();
   */
  this.getImageSupportUrl = () => {
    return _.get(Store.getState().toJS(), [
      'selection',
      'image',
      'supportUrl'
    ]);
  };

  /**
   * @summary Get image recommended drive size
   * @function
   * @public
   *
   * @returns {String} image recommended drive size
   *
   * @example
   * const imageRecommendedDriveSize = SelectionStateModel.getImageRecommendedDriveSize();
   */
  this.getImageRecommendedDriveSize = () => {
    return _.get(Store.getState().toJS(), [
      'selection',
      'image',
      'recommendedDriveSize'
    ]);
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
  this.hasDrive = () => {
    return Boolean(this.getDrive());
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
  this.hasImage = () => {
    return Boolean(this.getImage());
  };

  /**
   * @summary Remove drive
   * @function
   * @public
   *
   * @example
   * SelectionStateModel.removeDrive();
   */
  this.removeDrive = () => {
    Store.dispatch({
      type: Store.Actions.REMOVE_DRIVE
    });
  };

  /**
   * @summary Remove image
   * @function
   * @public
   *
   * @example
   * SelectionStateModel.removeImage();
   */
  this.removeImage = () => {
    Store.dispatch({
      type: Store.Actions.REMOVE_IMAGE
    });
  };

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
  this.clear = (options = {}) => {
    if (!options.preserveImage) {
      Store.dispatch({
        type: Store.Actions.REMOVE_IMAGE
      });
    }

    Store.dispatch({
      type: Store.Actions.REMOVE_DRIVE
    });
  };

  /**
   * @summary Check if a drive is the current drive
   * @function
   * @public
   *
   * @param {String} drive - drive device
   * @returns {Boolean} whether the drive is the current drive
   *
   * @example
   * if (SelectionStateModel.isCurrentDrive('/dev/sdb')) {
   *   console.log('This is the current drive!');
   * }
   */
  this.isCurrentDrive = (drive) => {
    if (!drive) {
      return false;
    }

    return drive === _.get(this.getDrive(), [ 'device' ]);
  };

});

module.exports = MODULE_NAME;
