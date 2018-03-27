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

module.exports = function (ModalService, $q) {
  let modal = null

  /**
   * @summary Open the file selector widget
   * @function
   * @public
   *
   * @example
   * DriveSelectorService.open()
   */
  this.open = () => {
    modal = ModalService.open({
      name: 'file-selector',
      template: require('../templates/file-selector-modal.tpl.html'),
      controller: 'FileSelectorController as selector',
      size: 'file-selector-modal'
    })
  }

  /**
   * @summary Close the file selector widget
   * @function
   * @public
   *
   * @example
   * DriveSelectorService.close()
   */
  this.close = () => {
    if (modal) {
      modal.close()
    }
  }
}
