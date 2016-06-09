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
 * @module Etcher.Models.SupportedFormats
 */

const angular = require('angular');
const _ = require('lodash');
const imageStream = require('etcher-image-stream');
const MODULE_NAME = 'Etcher.Models.SupportedFormats';
const SupportedFormats = angular.module(MODULE_NAME, []);

SupportedFormats.service('SupportedFormatsModel', function() {
  let self = this;

  /**
   * @summary Check if a file type is a compressed format
   * @function
   * @private
   *
   * @param {Object} fileType - file type
   * @returns {Boolean} whether the file type is a compressed format
   *
   * @example
   * if (isCompressedFileType({
   *   extension: 'zip',
   *   type: 'compressed'
   * })) {
   *   console.log('This is a compressed file type');
   * }
   */
  const isCompressedFileType = function(fileType) {
    return fileType.type === 'compressed';
  };

  /**
   * @summary Get compressed extensions
   * @function
   * @public
   *
   * @returns {String[]} compressed extensions
   *
   * SupportedFormatsModel.getCompressedExtensions().forEach(function(extension) {
   *   console.log('We support the ' + extension + ' compressed file format');
   * });
   */
  this.getCompressedExtensions = function() {
    return _.map(_.filter(imageStream.supportedFileTypes, isCompressedFileType), 'extension');
  };

  /**
   * @summary Get non compressed extensions
   * @function
   * @public
   *
   * @returns {String[]} no compressed extensions
   *
   * SupportedFormatsModel.getNonCompressedExtensions().forEach(function(extension) {
   *   console.log('We support the ' + extension + ' file format');
   * });
   */
  this.getNonCompressedExtensions = function() {
    return _.map(_.reject(imageStream.supportedFileTypes, isCompressedFileType), 'extension');
  };

  /**
   * @summary Get all supported extensions
   * @function
   * @public
   *
   * @returns {String[]} extensions
   *
   * SupportedFormatsModel.getAllExtensions().forEach(function(extension) {
   *   console.log('We support the ' + extension + ' format');
   * });
   */
  this.getAllExtensions = function() {
    return _.map(imageStream.supportedFileTypes, 'extension');
  };

  /**
   * @summary Check if an image is supported
   * @function
   * @public
   *
   * @param {String} image - image path
   * @returns {Boolean} whether the image is supported
   *
   * if (SupportedFormatsModel.isSupportedImage('foo.iso.bz2')) {
   *   console.log('The image is supported!');
   * }
   */
  this.isSupportedImage = function(image) {

    // We roll our own extension detection system instead of
    // using `path.extname()` since that function will only
    // return the last extension, while we're interested
    // to check every possible extension of an image path,
    // like `.tar.gz`.

    const firstDotIndex = image.indexOf('.');

    // An image without an extension is not considered a valid image
    if (firstDotIndex === -1) {
      return false;
    }

    const extensions = image.slice(firstDotIndex + 1).split('.');

    return _.every(extensions, function(extension) {
      return _.includes(self.getAllExtensions(), extension);
    });
  };

});

module.exports = MODULE_NAME;
