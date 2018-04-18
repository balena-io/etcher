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

import * as _ from 'lodash'
import * as store from '../store'
import * as availableDrives from './available-drives'

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
export const selectDrive = (driveDevice) => {
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
export const toggleDrive = (driveDevice) => {
  if (isDriveSelected(driveDevice)) {
    deselectDrive(driveDevice)
  } else {
    selectDrive(driveDevice)
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
export const deselectOtherDrives = (driveDevice) => {
  if (isDriveSelected(driveDevice)) {
    const otherDevices = _.reject(getSelectedDevices(), _.partial(_.isEqual, driveDevice))
    _.each(otherDevices, deselectDrive)
  } else {
    deselectAllDrives()
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
 *   size: {
 *     original: 1000000000,
 *     final: {
 *       estimation: false,
 *       value: 1000000000
 *     }
 *   }
 * });
 */
export const selectImage = (image) => {
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
export const getSelectedDevices = () => {
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
export const getSelectedDrives = () => {
  const drives = availableDrives.getDrives()
  return _.map(getSelectedDevices(), (device) => {
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
export const getCurrentDrive = () => {
  const device = _.head(getSelectedDevices())
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
export const getImage = () => {
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
export const getImagePath = () => {
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
export const getImageSize = () => {
  return _.get(store.getState().toJS(), [
    'selection',
    'image',
    'size',
    'final',
    'value'
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
export const getImageUrl = () => {
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
export const getImageName = () => {
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
export const getImageLogo = () => {
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
export const getImageSupportUrl = () => {
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
export const getImageRecommendedDriveSize = () => {
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
export const hasDrive = () => {
  return Boolean(getSelectedDevices().length)
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
export const hasImage = () => {
  return Boolean(getImage())
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
export const deselectDrive = (driveDevice) => {
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
export const deselectImage = () => {
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
export const deselectAllDrives = () => {
  _.each(getSelectedDevices(), deselectDrive)
}

/**
 * @summary Clear selections
 * @function
 * @public
 *
 * @example
 * selectionState.clear();
 */
export const clear = () => {
  deselectImage()
  deselectAllDrives()
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
export const isCurrentDrive = (driveDevice) => {
  if (!driveDevice) {
    return false
  }

  return driveDevice === _.get(getCurrentDrive(), [ 'device' ])
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
export const isDriveSelected = (driveDevice) => {
  if (!driveDevice) {
    return false
  }

  const selectedDriveDevices = getSelectedDevices()
  return _.includes(selectedDriveDevices, driveDevice)
}
