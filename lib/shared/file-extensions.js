/*
 * Copyright 2017 balena.io
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

const mime = require('mime-types')
const _ = require('lodash')

/**
 * @summary Get the extensions of a file
 * @function
 * @public
 *
 * @param {String} filePath - file path
 * @returns {String[]} extensions
 *
 * @example
 * const extensions = fileExtensions.getFileExtensions('path/to/foo.img.gz');
 * console.log(extensions);
 * > [ 'img', 'gz' ]
 */
exports.getFileExtensions = _.memoize((filePath) => {
  return _.chain(filePath)
    .split('.')
    .tail()
    .map(_.toLower)
    .value()
})

/**
 * @summary Get the last file extension
 * @function
 * @public
 *
 * @param {String} filePath - file path
 * @returns {(String|Null)} last extension
 *
 * @example
 * const extension = fileExtensions.getLastFileExtension('path/to/foo.img.gz');
 * console.log(extension);
 * > 'gz'
 */
exports.getLastFileExtension = (filePath) => {
  return _.last(exports.getFileExtensions(filePath)) || null
}

/**
 * @summary Get the penultimate file extension
 * @function
 * @public
 *
 * @param {String} filePath - file path
 * @returns {(String|Null)} penultimate extension
 *
 * @example
 * const extension = fileExtensions.getPenultimateFileExtension('path/to/foo.img.gz');
 * console.log(extension);
 * > 'img'
 */
exports.getPenultimateFileExtension = (filePath) => {
  const ext = _.last(_.initial(exports.getFileExtensions(filePath)))
  return !_.isNil(ext) && mime.lookup(ext) ? ext : null
}
