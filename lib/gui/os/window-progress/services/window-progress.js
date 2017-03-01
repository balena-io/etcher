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

const electron = require('electron');

module.exports = function() {

  /**
   * @summary A reference to the current renderer Electron window
   * @property
   * @protected
   *
   * @description
   * We expose this property to `this` for testability purposes.
   */
  this.currentWindow = electron.remote.getCurrentWindow();

  /**
   * @summary Set operating system window progress
   * @function
   * @public
   *
   * @description
   * Show progress inline in operating system task bar
   *
   * @param {Number} percentage - percentage
   *
   * @example
   * OSWindowProgressService.set(85);
   */
  this.set = (percentage) => {
    const PERCENTAGE_MINIMUM = 0;
    const PERCENTAGE_MAXIMUM = 100;

    if (percentage > PERCENTAGE_MAXIMUM || percentage < PERCENTAGE_MINIMUM) {
      throw new Error(`Invalid window progress percentage: ${percentage}`);
    }

    this.currentWindow.setProgressBar(percentage / PERCENTAGE_MAXIMUM);
  };

  /**
   * @summary Clear the operating system window progress bar
   * @function
   * @public
   *
   * @example
   * OSWindowProgressService.clear();
   */
  this.clear = () => {

    // Passing 0 or null/undefined doesn't work.
    const ELECTRON_PROGRESS_BAR_RESET_VALUE = -1;

    this.currentWindow.setProgressBar(ELECTRON_PROGRESS_BAR_RESET_VALUE);
  };

};
