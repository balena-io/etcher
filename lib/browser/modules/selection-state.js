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
 * @module ResinEtcher.selection-state
 */

const _ = require('lodash');
const angular = require('angular');
const selectionState = angular.module('ResinEtcher.selection-state', []);

selectionState.service('SelectionStateService', function() {
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
   * SelectionStateService.setDrive({
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
   * SelectionStateService.setImage('foo.img');
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
   * const drive = SelectionStateService.getDrive();
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
   * const image = SelectionStateService.getImage();
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
   * if (SelectionStateService.hasDrive()) {
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
   * if (SelectionStateService.hasImage()) {
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
   * SelectionStateService.removeDrive();
   */
  this.removeDrive = _.partial(self.setDrive, undefined);

  /**
   * @summary Remove image
   * @function
   * @public
   *
   * @example
   * SelectionStateService.removeImage();
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
   * SelectionStateService.clear();
   *
   * @example
   * SelectionStateService.clear({ preserveImage: true });
   */
  this.clear = function(options) {
    if (options && options.preserveImage) {
      selection = _.pick(selection, 'image');
    } else {
      selection = {};
    }
  };

});
