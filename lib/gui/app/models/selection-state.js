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

'use strict'

const _ = require('lodash')
const store = require('./store')
const availableDrives = require('./available-drives')

/**
 * @summary Select a drive by its device path
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device
 *
 * @example
 * selectionState.selectDrive('/dev/disk2');
 */
exports.selectDrive = (driveDevice) => {
  store.dispatch({
    type: store.Actions.SELECT_DRIVE,
    data: driveDevice
  })
}

/**
 * @summary Toggle drive selection
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device
 *
 * @example
 * selectionState.toggleDrive('/dev/disk2');
 */
exports.toggleDrive = (driveDevice) => {
  if (exports.isDriveSelected(driveDevice)) {
    exports.deselectDrive(driveDevice)
  } else {
    exports.selectDrive(driveDevice)
  }
}

/**
 * @summary Deselect all other drives and keep the current drive's status
 * @function
 * @public
 * @deprecated
 *
 * @description
 * This is a temporary function during the transition to multi-writes,
 * remove this and its uses when multi-selection should become user-facing.
 *
 * @param {String} driveDevice - drive device identifier
 *
 * @example
 * console.log(selectionState.getSelectedDevices())
 * > [ '/dev/disk1', '/dev/disk2', '/dev/disk3' ]
 * selectionState.deselectOtherDrives('/dev/disk2')
 * console.log(selectionState.getSelectedDevices())
 * > [ '/dev/disk2' ]
 */
exports.deselectOtherDrives = (driveDevice) => {
  if (exports.isDriveSelected(driveDevice)) {
    const otherDevices = _.reject(exports.getSelectedDevices(), _.partial(_.isEqual, driveDevice))
    _.each(otherDevices, exports.deselectDrive)
  } else {
    exports.deselectAllDrives()
  }
}

/**
 * @summary Select an image
 * @function
 * @public
 *
 * @param {Object} image - image
 *
 * @example
 * selectionState.selectImage({
 *   path: 'foo.img',
 *   size: 1000000000,
 *   compressedSize: 1000000000,
 *   isSizeEstimated: false,
 * });
 */
exports.selectImage = (image) => {
  store.dispatch({
    type: store.Actions.SELECT_IMAGE,
    data: image
  })
}

/**
 * @summary Get all selected drives' devices
 * @function
 * @public
 *
 * @returns {String[]} selected drives' devices
 *
 * @example
 * for (driveDevice of selectionState.getSelectedDevices()) {
 *   console.log(driveDevice)
 * }
 * > '/dev/disk1'
 * > '/dev/disk2'
 */
exports.getSelectedDevices = () => {
  return store.getState().getIn([ 'selection', 'devices' ]).toJS()
}

/**
 * @summary Get all selected drive objects
 * @function
 * @public
 *
 * @returns {Object[]} selected drive objects
 *
 * @example
 * for (drive of selectionState.getSelectedDrives()) {
 *   console.log(drive)
 * }
 * > '{ device: '/dev/disk1', size: 123456789, ... }'
 * > '{ device: '/dev/disk2', size: 987654321, ... }'
 */
exports.getSelectedDrives = () => {
  const drives = availableDrives.getDrives()
  return _.map(exports.getSelectedDevices(), (device) => {
    return _.find(drives, { device })
  })
}

/**
 * @summary Get the head of the list of selected drives
 * @function
 * @public
 *
 * @returns {Object} drive
 *
 * @example
 * const drive = selectionState.getCurrentDrive();
 * console.log(drive)
 * > { device: '/dev/disk1', name: 'Flash drive', ... }
 */
exports.getCurrentDrive = () => {
  const device = _.head(exports.getSelectedDevices())
  return _.find(availableDrives.getDrives(), { device })
}

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
  return _.get(store.getState().toJS(), [ 'selection', 'image' ])
}

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
  ])
}

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
    'size'
  ])
}

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
  ])
}

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
  ])
}

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
  ])
}

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
  ])
}

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
  ])
}

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
  return Boolean(exports.getSelectedDevices().length)
}

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
  return Boolean(exports.getImage())
}

/**
 * @summary Remove drive from selection
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device identifier
 *
 * @example
 * selectionState.deselectDrive('/dev/sdc');
 *
 * @example
 * selectionState.deselectDrive('\\\\.\\PHYSICALDRIVE3');
 */
exports.deselectDrive = (driveDevice) => {
  store.dispatch({
    type: store.Actions.DESELECT_DRIVE,
    data: driveDevice
  })
}

/**
 * @summary Deselect image
 * @function
 * @public
 *
 * @example
 * selectionState.deselectImage();
 */
exports.deselectImage = () => {
  store.dispatch({
    type: store.Actions.DESELECT_IMAGE
  })
}

/**
 * @summary Deselect all drives
 * @function
 * @public
 *
 * @example
 * selectionState.deselectAllDrives()
 */
exports.deselectAllDrives = () => {
  _.each(exports.getSelectedDevices(), exports.deselectDrive)
}

/**
 * @summary Clear selections
 * @function
 * @public
 *
 * @example
 * selectionState.clear();
 */
exports.clear = () => {
  exports.deselectImage()
  exports.deselectAllDrives()
}

/**
 * @summary Check if a drive is the current drive
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device
 * @returns {Boolean} whether the drive is the current drive
 *
 * @example
 * if (selectionState.isCurrentDrive('/dev/sdb')) {
 *   console.log('This is the current drive!');
 * }
 */
exports.isCurrentDrive = (driveDevice) => {
  if (!driveDevice) {
    return false
  }

  return driveDevice === _.get(exports.getCurrentDrive(), [ 'device' ])
}

/**
 * @summary Check whether a given device is selected.
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device identifier
 * @returns {Boolean}
 *
 * @example
 * const isSelected = selectionState.isDriveSelected('/dev/sdb')
 *
 * if (isSelected) {
 *   selectionState.deselectDrive(driveDevice)
 * }
 */
exports.isDriveSelected = (driveDevice) => {
  if (!driveDevice) {
    return false
  }

  const selectedDriveDevices = exports.getSelectedDevices()
  return _.includes(selectedDriveDevices, driveDevice)
}
