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
   * @summary Open the wifi modal
   * @function
   * @public
   *
   * @fulfil {(Object|Undefined)} - connection
   * @returns {Promise}
   *
   * @example
   * WifiService.open().then((connection) => {
   *   console.log(connection);
   * });
   */
  this.open = () => {
    modal = ModalService.open({
      name: 'wifi',
      template: require('../templates/wifi.tpl.html'),
      controller: 'WifiController as wifi',
      size: 'wifi-modal'
    })

    return modal.result
  }

  /**
   * @summary Close the wifi modal
   * @function
   * @public
   *
   * @fulfil {Undefined}
   * @returns {Promise}
   *
   * @example
   * WifiService.close();
   */
  this.close = () => {
    if (modal) {
      return modal.close()
    }

    // Resolve `undefined` if the modal
    // was already closed for consistency
    return $q.resolve()
  }
}
