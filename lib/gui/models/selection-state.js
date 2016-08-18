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
const Store = require('./store');
const MODULE_NAME = 'Etcher.Models.SelectionState';
const SelectionStateModel = angular.module(MODULE_NAME, []);

SelectionStateModel.service('SelectionStateModel', function() {

  /**
   * @summary Set a drive
   * @function
   * @public
   *
   * @param {Object} drive - drive
   *
   * @example
   * SelectionStateModel.setDrive({
   *   device: '/dev/disk2',
   *   name: 'USB drive',
   *   size: 999999999
   * });
   */
  this.setDrive = (drive) => {
    Store.dispatch({
      type: Store.Actions.SELECT_DRIVE,
      data: drive
    });
  };

  this.setDownload = (download) => {
    Store.dispatch({
      type: Store.Actions.SELECT_DOWNLOAD,
      data: download
    });
  };

  this.setNetworkTypeState = (network) => {
    Store.dispatch({
      type: Store.Actions.SELECT_NETWORK_TYPE,
      data: network
    });
  };

  this.setNetworkConfigurationState = (network) => {
    Store.dispatch({
      type: Store.Actions.SELECT_NETWORK_CONFIGURATION,
      data: network
    });
  };

  /**
   * @summary Check if a drive is large enough for the selected image
   * @function
   * @public
   *
   * @description
   * For convenience, if there is no image selected, this function
   * returns true.
   *
   * Notice that if you select the drive before the image, the check
   * will not take place and it'll be the client's responsibility
   * to do so.
   *
   * @param {Object} drive - drive
   * @returns {Boolean} whether the drive is large enough
   *
   * @example
   * SelectionStateModel.setImage({
   *   path: 'rpi.img',
   *   size: 100000000
   * });
   *
   * if (SelectionStateModel.isDriveLargeEnough({
   *   device: '/dev/disk2',
   *   name: 'My Drive',
   *   size: 123456789
   * })) {
   *   console.log('We can flash the image to this drive!');
   * }
   */
  this.isDriveLargeEnough = (drive) => {
    return (this.getImageSize() || 0) <= drive.size;
  };

  /**
   * @summary Check if a drive is locked
   * @function
   * @public
   *
   * @description
   * This usually points out a locked SD Card.
   *
   * @param {Object} drive - drive
   * @returns {Boolean} whether the drive is locked
   *
   * @example
   * if (SelectionStateModel.isDriveLocked({
   *   device: '/dev/disk2',
   *   name: 'My Drive',
   *   size: 123456789,
   *   protected: true
   * })) {
   *   console.log('This drive is locked (e.g: write-protected)');
   * }
   */
  this.isDriveLocked = (drive) => {
    return _.get(drive, 'protected', false);
  };

  /**
   * @summary Check if a drive is valid
   * @function
   * @public
   *
   * @description
   * This function is a facade to:
   *
   * - `SelectionStateModel.isDriveLargeEnough()`
   * - `SelectionStateModel.isDriveLocked()`
   *
   * @param {Object} drive - drive
   * @returns {Boolean} whether the drive is valid
   *
   * @example
   * if (SelectionStateModel.isDriveValid({
   *   device: '/dev/disk2',
   *   name: 'My Drive',
   *   size: 123456789,
   *   protected: true
   * })) {
   *   console.log('This drive is valid!');
   * }
   */
  this.isDriveValid = (drive) => {
    return _.every([
      this.isDriveLargeEnough(drive),
      !this.isDriveLocked(drive)
    ]);
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
    return _.get(Store.getState().toJS(), 'selection.drive');
  };
  this.getDownload = () => {
    return _.get(Store.getState().toJS(), 'selection.download');
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
    return _.get(Store.getState().toJS(), 'selection.image.path');
  };

  this.getDownloadPath = () => {
    return _.get(Store.getState().toJS(), 'selection.download.name');
  }

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
    return _.get(Store.getState().toJS(), 'selection.image.size');
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

  this.hasDownload = () => {
    return Boolean(this.getDownload());
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
    return Boolean(this.getImagePath() && this.getImageSize());
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
  this.clear = (options) => {
    options = options || {};

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
  this.isCurrentDrive = (drive) => {
    if (!drive || !drive.device) {
      return false;
    }

    return drive.device === _.get(this.getDrive(), 'device');
  };

});

module.exports = MODULE_NAME;
