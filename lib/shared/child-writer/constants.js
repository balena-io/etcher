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

const path = require('path');

/**
 * @summary Child writer constants
 * @namespace CONSTANTS
 * @public
 */
module.exports = {

  /**
   * @property {String} PROJECT_ROOT
   * @memberof CONSTANTS
   */
  PROJECT_ROOT: path.join(__dirname, '..', '..', '..'),

  /**
   * @property {String} WRITER_PROXY_SCRIPT
   * @memberof CONSTANTS
   */
  WRITER_PROXY_SCRIPT: path.join(__dirname, 'writer-proxy.js')

};
