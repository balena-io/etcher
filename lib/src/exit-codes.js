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
 * @summary Etcher exit codes
 * @namespace EXIT_CODES
 * @public
 */
module.exports = {

  /**
   * @property {Number} SUCCESS
   * @memberof EXIT_CODES
   *
   * @description
   * This exit code is used to represent a successful exit
   * status, with no problems on the way.
   */
  SUCCESS: 0,

  /**
   * @property {Number} GENERAL_ERROR
   * @memberof EXIT_CODES
   *
   * @description
   * This exit code is used to represent a general error
   * situation. If the reasons of the error is not
   * documented as a specialised error code, this one
   * should be used.
   */
  GENERAL_ERROR: 1,

  /**
   * @property {Number} VALIDATION_ERROR
   * @memberof EXIT_CODES
   *
   * @description
   * This exit code is used to represent a validation error.
   */
  VALIDATION_ERROR: 2,

  /**
   * @property {Number} CANCELLED
   * @memberof EXIT_CODES
   *
   * @description
   * This exit code is used to represent a cancelled write process.
   */
  CANCELLED: 3

};
