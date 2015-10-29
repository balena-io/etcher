/* The MIT License
 *
 * Copyright (c) 2015 Resin.io. https://resin.io.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * @module herostratus.selection-state
 */

var angular = require('angular');
var selectionState = angular.module('herostratus.selection-state', []);

selectionState.service('SelectionStateService', function() {
  'use strict';

  var self = this;

  /**
   * @summary Selection state
   * @type Object
   * @private
   */
  var selection = {};

  /**
   * @summary Set a drive
   * @function
   * @public
   *
   * @param {String} drive - drive
   *
   * @example
   * SelectionStateService.setDrive('/dev/disk2');
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
   * @returns {String} drive
   *
   * @example
   * var drive = SelectionStateService.getDrive();
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
   * var image = SelectionStateService.getImage();
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
    return !!self.getDrive();
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
    return !!self.getImage();
  };

});
