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
 * @module Etcher.Models.SupportedFormats
 */

const angular = require('angular');
const _ = require('lodash');
const path = require('path');
const imageStream = require('etcher-image-stream');
const MODULE_NAME = 'Etcher.Models.SupportedFormats';
const SupportedFormats = angular.module(MODULE_NAME, []);

SupportedFormats.service('SupportedFormatsModel', function() {

  /**
   * @summary Build an extension list getter from a type
   * @function
   * @private
   *
   * @param {String} type - file type
   * @returns {Function} extension list getter
   *
   * @example
   * const extensions = getExtensionsFromTypeGetter('archive')();
   */
  const getExtensionsFromTypeGetter = (type) => {
    return () => {
      return _.map(_.filter(imageStream.supportedFileTypes, (fileType) => {
        return fileType.type === type;
      }), 'extension');
    };
  };

  /**
   * @summary Get compressed extensions
   * @function
   * @public
   *
   * @returns {String[]} compressed extensions
   *
   * SupportedFormatsModel.getCompressedExtensions().forEach((extension) => {
   *   console.log('We support the ' + extension + ' compressed file format');
   * });
   */
  this.getCompressedExtensions = getExtensionsFromTypeGetter('compressed');

  /**
   * @summary Get non compressed extensions
   * @function
   * @public
   *
   * @returns {String[]} no compressed extensions
   *
   * SupportedFormatsModel.getNonCompressedExtensions().forEach((extension) => {
   *   console.log('We support the ' + extension + ' file format');
   * });
   */
  this.getNonCompressedExtensions = getExtensionsFromTypeGetter('image');

  /**
   * @summary Get archive extensions
   * @function
   * @public
   *
   * @returns {String[]} archive extensions
   *
   * SupportedFormatsModel.getArchiveExtensions().forEach((extension) => {
   *   console.log('We support the ' + extension + ' file format');
   * });
   */
  this.getArchiveExtensions = getExtensionsFromTypeGetter('archive');

  /**
   * @summary Get all supported extensions
   * @function
   * @public
   *
   * @returns {String[]} extensions
   *
   * SupportedFormatsModel.getAllExtensions().forEach((extension) => {
   *   console.log('We support the ' + extension + ' format');
   * });
   */
  this.getAllExtensions = () => {
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
  this.isSupportedImage = (image) => {
    const extension = path.extname(image).slice(1).toLowerCase();

    if (_.some([
      _.includes(this.getNonCompressedExtensions(), extension),
      _.includes(this.getArchiveExtensions(), extension)
    ])) {
      return true;
    }

    if (!_.includes(this.getCompressedExtensions(), extension)) {
      return false;
    }

    return this.isSupportedImage(path.basename(image, `.${extension}`));
  };

});

module.exports = MODULE_NAME;
