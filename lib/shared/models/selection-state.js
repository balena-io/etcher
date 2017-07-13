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

const _ = require('lodash');
const store = require('../store');
const availableDrives = require('./available-drives');

/**
 * @summary Set a drive
 * @function
 * @public
 *
 * @param {String} drive - drive device
 *
 * @example
 * selectionState.setDrive('/dev/disk2');
 */
exports.setDrive = (drive) => {
  store.dispatch({
    type: store.Actions.SELECT_DRIVE,
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
 * selectionState.toggleSetDrive('/dev/disk2');
 */
exports.toggleSetDrive = (drive) => {
  if (exports.isCurrentDrive(drive)) {
    exports.removeDrive();
  } else {
    exports.setDrive(drive);
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
 * selectionState.setImage({
 *   path: 'foo.img'
 * });
 */
exports.setImage = (image) => {
  store.dispatch({
    type: store.Actions.SELECT_IMAGE,
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
 * const drive = selectionState.getDrive();
 */
exports.getDrive = () => {
  return _.find(availableDrives.getDrives(), {
    device: store.getState().getIn([ 'selection', 'drive' ])
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
 * const image = selectionState.getImage();
 */
exports.getImage = () => {
  return _.get(store.getState().toJS(), [ 'selection', 'image' ]);
};

/**
 * @summary Get image path
 * @function
 * @public
 *
 * @returns {String} image path
 *
 * @example
 * const imagePath = selectionState.getImagePath();
 */
exports.getImagePath = () => {
  return _.get(store.getState().toJS(), [
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
 * const imageSize = selectionState.getImageSize();
 */
exports.getImageSize = () => {
  return _.get(store.getState().toJS(), [
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
 * const imageUrl = selectionState.getImageUrl();
 */
exports.getImageUrl = () => {
  return _.get(store.getState().toJS(), [
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
 * const imageName = selectionState.getImageName();
 */
exports.getImageName = () => {
  return _.get(store.getState().toJS(), [
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
 * const imageLogo = selectionState.getImageLogo();
 */
exports.getImageLogo = () => {
  return _.get(store.getState().toJS(), [
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
 * const imageSupportUrl = selectionState.getImageSupportUrl();
 */
exports.getImageSupportUrl = () => {
  return _.get(store.getState().toJS(), [
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
 * const imageRecommendedDriveSize = selectionState.getImageRecommendedDriveSize();
 */
exports.getImageRecommendedDriveSize = () => {
  return _.get(store.getState().toJS(), [
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
 * if (selectionState.hasDrive()) {
 *   console.log('There is a drive!');
 * }
 */
exports.hasDrive = () => {
  return Boolean(exports.getDrive());
};

/**
 * @summary Check if there is a selected image
 * @function
 * @public
 *
 * @returns {Boolean} whether there is a selected image
 *
 * @example
 * if (selectionState.hasImage()) {
 *   console.log('There is an image!');
 * }
 */
exports.hasImage = () => {
  return Boolean(exports.getImage());
};

/**
 * @summary Remove drive
 * @function
 * @public
 *
 * @example
 * selectionState.removeDrive();
 */
exports.removeDrive = () => {
  store.dispatch({
    type: store.Actions.REMOVE_DRIVE
  });
};

/**
 * @summary Remove image
 * @function
 * @public
 *
 * @example
 * selectionState.removeImage();
 */
exports.removeImage = () => {
  store.dispatch({
    type: store.Actions.REMOVE_IMAGE
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
 * selectionState.clear();
 *
 * @example
 * selectionState.clear({ preserveImage: true });
 */
exports.clear = (options = {}) => {
  if (!options.preserveImage) {
    store.dispatch({
      type: store.Actions.REMOVE_IMAGE
    });
  }

  store.dispatch({
    type: store.Actions.REMOVE_DRIVE
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
 * if (selectionState.isCurrentDrive('/dev/sdb')) {
 *   console.log('This is the current drive!');
 * }
 */
exports.isCurrentDrive = (drive) => {
  if (!drive) {
    return false;
  }

  return drive === _.get(exports.getDrive(), [ 'device' ]);
};
