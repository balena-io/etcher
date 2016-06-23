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

/*
 * Based on:
 * http://www.codelord.net/2015/05/04/angularjs-notifying-about-changes-from-services-to-controllers/
 */

module.exports = function($rootScope) {

  /**
   * @summary Safely subscribe to an event
   * @function
   * @public
   *
   * @description
   * We say "safely" since this subscribe function will listen
   * to the scope's `$destroy` event and unbind itself automatically.
   *
   * @param {Object} scope - angular scope
   * @param {String} name - event name
   * @param {Function} callback - callback
   *
   * @example
   * NotifierService.subscribe($scope, 'my-event', () => {
   *   console.log('Event received!');
   * });
   */
  this.subscribe = (scope, name, callback) => {
    const handler = $rootScope.$on(name, (event, data) => {
      return callback(data);
    });

    scope.$on('$destroy', handler);
  };

  /**
   * @summary Emit an event
   * @function
   * @public
   *
   * @param {String} name - event name
   * @param {*} data - event data
   *
   * @example
   * NotifierService.emit('my-event', 'Foo');
   */
  this.emit = (name, data) => {
    $rootScope.$emit(name, data);
  };

};
