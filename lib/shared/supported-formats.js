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
const path = require('path');
const imageStream = require('../image-stream');

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
    return _.map(_.filter(imageStream.supportedFileTypes, {
      type
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
 * _.each(supportedFormats.getCompressedExtensions(), (extension) => {
 *   console.log('We support the ' + extension + ' compressed file format');
 * });
 */
exports.getCompressedExtensions = getExtensionsFromTypeGetter('compressed');

/**
 * @summary Get non compressed extensions
 * @function
 * @public
 *
 * @returns {String[]} no compressed extensions
 *
 * _.each(supportedFormats.getNonCompressedExtensions(), (extension) => {
 *   console.log('We support the ' + extension + ' file format');
 * });
 */
exports.getNonCompressedExtensions = getExtensionsFromTypeGetter('image');

/**
 * @summary Get archive extensions
 * @function
 * @public
 *
 * @returns {String[]} archive extensions
 *
 * _.each(supportedFormats.getArchiveExtensions(), (extension) => {
 *   console.log('We support the ' + extension + ' file format');
 * });
 */
exports.getArchiveExtensions = getExtensionsFromTypeGetter('archive');

/**
 * @summary Get all supported extensions
 * @function
 * @public
 *
 * @returns {String[]} extensions
 *
 * _.each(supportedFormats.getAllExtensions(), (extension) => {
 *   console.log('We support the ' + extension + ' format');
 * });
 */
exports.getAllExtensions = () => {
  return _.map(imageStream.supportedFileTypes, 'extension');
};

/**
 * @summary Check if an image is supported
 * @function
 * @public
 *
 * @param {String} imagePath - image path
 * @returns {Boolean} whether the image is supported
 *
 * if (supportedFormats.isSupportedImage('foo.iso.bz2')) {
 *   console.log('The image is supported!');
 * }
 */
exports.isSupportedImage = (imagePath) => {
  const extension = _.toLower(_.replace(path.extname(imagePath), '.', ''));

  if (_.some([
    _.includes(exports.getNonCompressedExtensions(), extension),
    _.includes(exports.getArchiveExtensions(), extension)
  ])) {
    return true;
  }

  if (!_.includes(exports.getCompressedExtensions(), extension)) {
    return false;
  }

  return exports.isSupportedImage(path.basename(imagePath, `.${extension}`));
};

/**
 * @summary Check if an image seems to be a Windows image
 * @function
 * @public
 *
 * @param {String} imagePath - image path
 * @returns {Boolean} whether the image seems to be a Windows image
 *
 * @example
 * if (supportedFormats.looksLikeWindowsImage('path/to/en_windows_7_ultimate_with_sp1_x86_dvd_u_677460.iso')) {
 *   console.log('Looks like a Windows image');
 * }
 */
exports.looksLikeWindowsImage = (imagePath) => {
  const regex = /windows|win7|win8|win10|winxp/i;
  return regex.test(path.basename(imagePath));
};
