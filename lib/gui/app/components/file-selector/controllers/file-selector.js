/*
 * Copyright 2018 resin.io
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

const os = require('os')
const settings = require('../../../models/settings')
const utils = require('../../../../../shared/utils')
const angular = require('angular')

/* eslint-disable lodash/prefer-lodash-method */

module.exports = function (
  $uibModalInstance
) {
  /**
   * @summary Close the modal
   * @function
   * @public
   *
   * @example
   * FileSelectorController.close();
   */
  this.close = () => {
    $uibModalInstance.close()
  }

  /**
   * @summary Folder to constrain the file picker to
   * @function
   * @public
   *
   * @returns {String} - folder to constrain by
   *
   * @example
   * FileSelectorController.getFolderConstraint()
   */
  this.getFolderConstraint = utils.memoize(() => {
    return settings.has('fileBrowserConstraintPath')
      ? settings.get('fileBrowserConstraintPath')
      : ''
  }, angular.equals)

  /**
   * @summary Get initial path
   * @function
   * @public
   *
   * @returns {String} - path
   *
   * @example
   * <file-selector path="FileSelectorController.getPath()"></file-selector>
   */
  this.getPath = () => {
    return this.getFolderConstraint() ? '/' : os.homedir()
  }
}
