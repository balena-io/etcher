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
 * This file is only meant to be loaded by the renderer process.
 */

const path = require('path');
const isRunningInAsar = require('electron-is-running-in-asar');
const electron = require('electron');
const CONSTANTS = require('./constants');

/**
 * @summary Get application entry point
 * @function
 * @public
 *
 * @returns {String} entry point
 *
 * @example
 * const entryPoint = rendererUtils.getApplicationEntryPoint();
 */
exports.getApplicationEntryPoint = () => {
  if (isRunningInAsar()) {
    return path.join(process.resourcesPath, 'app.asar');
  }

  // On GNU/Linux, `pkexec` resolves relative paths
  // from `/root`, therefore we pass an absolute path,
  // in order to be on the safe side.
  return path.join(CONSTANTS.PROJECT_ROOT, electron.remote.process.argv[1]);

};
