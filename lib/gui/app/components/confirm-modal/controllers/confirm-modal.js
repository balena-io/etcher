/*
 * Copyright 2018 balena.io
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

module.exports = function ($uibModalInstance, options) {
  /**
   * @summary Modal options
   * @type {Object}
   * @public
   */
  this.options = options

  /**
   * @summary Reject the warning prompt
   * @function
   * @public
   *
   * @example
   * WarningModalController.reject();
   */
  this.reject = () => {
    $uibModalInstance.close(false)
  }

  /**
   * @summary Accept the warning prompt
   * @function
   * @public
   *
   * @example
   * WarningModalController.accept();
   */
  this.accept = () => {
    $uibModalInstance.close(true)
  }
}
