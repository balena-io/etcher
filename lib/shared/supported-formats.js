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

const sdk = require('etcher-sdk')
const _ = require('lodash')
const mime = require('mime-types')
const path = require('path')

const fileExtensions = require('./file-extensions')

/**
 * @summary Get compressed extensions
 * @function
 * @public
 *
 * @returns {String[]} compressed extensions
 *
 * @example
 * _.each(supportedFormats.getCompressedExtensions(), (extension) => {
 *   console.log('We support the ' + extension + ' compressed file format');
 * });
 */
exports.getCompressedExtensions = () => {
  const result = []
  for (const [ mimetype, cls ] of sdk.sourceDestination.SourceDestination.mimetypes.entries()) {
    if (cls.prototype instanceof sdk.sourceDestination.CompressedSource) {
      const extension = mime.extension(mimetype)
      if (extension) {
        result.push(extension)
      }
    }
  }
  return result
}

/**
 * @summary Get non compressed extensions
 * @function
 * @public
 *
 * @returns {String[]} no compressed extensions
 *
 * @example
 * _.each(supportedFormats.getNonCompressedExtensions(), (extension) => {
 *   console.log('We support the ' + extension + ' file format');
 * });
 */
exports.getNonCompressedExtensions = () => {
  return sdk.sourceDestination.SourceDestination.imageExtensions
}

/**
 * @summary Get archive extensions
 * @function
 * @public
 *
 * @returns {String[]} archive extensions
 *
 * @example
 * _.each(supportedFormats.getArchiveExtensions(), (extension) => {
 *   console.log('We support the ' + extension + ' file format');
 * });
 */
exports.getArchiveExtensions = () => {
  return [ 'zip', 'etch' ]
}

/**
 * @summary Get all supported extensions
 * @function
 * @public
 *
 * @returns {String[]} extensions
 *
 * @example
 * _.each(supportedFormats.getAllExtensions(), (extension) => {
 *   console.log('We support the ' + extension + ' format');
 * });
 */
exports.getAllExtensions = () => {
  return [ ...exports.getArchiveExtensions(), ...exports.getNonCompressedExtensions(), ...exports.getCompressedExtensions() ]
}

/**
 * @summary Check if an image is supported
 * @function
 * @public
 *
 * @param {String} imagePath - image path
 * @returns {Boolean} whether the image is supported
 *
 * @example
 * if (supportedFormats.isSupportedImage('foo.iso.bz2')) {
 *   console.log('The image is supported!');
 * }
 */
exports.isSupportedImage = (imagePath) => {
  const lastExtension = fileExtensions.getLastFileExtension(imagePath)
  const penultimateExtension = fileExtensions.getPenultimateFileExtension(imagePath)

  if (_.some([
    _.includes(exports.getNonCompressedExtensions(), lastExtension),
    _.includes(exports.getArchiveExtensions(), lastExtension)
  ])) {
    return true
  }

  if (_.every([
    _.includes(exports.getCompressedExtensions(), lastExtension),
    _.includes(exports.getNonCompressedExtensions(), penultimateExtension)
  ])) {
    return true
  }

  return _.isNil(penultimateExtension) &&
    _.includes(exports.getCompressedExtensions(), lastExtension)
}

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
  const regex = /windows|win7|win8|win10|winxp/i
  return regex.test(path.basename(imagePath))
}
