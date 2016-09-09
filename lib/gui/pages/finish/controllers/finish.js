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

const path = require('path');

module.exports = function(
  $state,
  FlashStateModel,
  SelectionStateModel,
  AnalyticsService,
  SettingsModel,
  OSMarkdownWindowService,
  ErrorService
) {

  /**
   * @summary Settings model
   * @type Object
   * @public
   */
  this.settings = SettingsModel;

  /**
   * @summary Source checksum
   * @type String
   * @public
   */
  this.checksum = FlashStateModel.getLastFlashSourceChecksum();

  /**
   * @summary Image instructions
   * @type String
   * @public
   */
  this.instructions = SelectionStateModel.getImageInstructions();

  /**
   * @summary Display markdown instructions
   * @function
   * @public
   *
   * @param {String} instructions - markdown instructions
   *
   * @example
   * FinishController.displayInstructions('# Hello world!');
   */
  this.displayInstructions = (instructions) => {
    const imageName = SelectionStateModel.getImageName();
    const imagePath = SelectionStateModel.getImagePath();
    const stylesheetPath = path.join(
      process.env.ETCHER_ROOT_PATH,
      'build',
      'css',
      'os',
      'markdown-window',
      'styles',
      'markdown-window.css'
    );

    OSMarkdownWindowService.display(instructions, {
      title: imageName || path.basename(imagePath),
      width: 600,
      height: 600,
      stylesheetPath: stylesheetPath
    }).catch(ErrorService.reportException);
  };

  /**
   * @summary Restart the flashing process
   * @function
   * @public
   *
   * @param {Object} [options] - options
   * @param {Boolean} [options.preserveImage=false] - preserve image
   *
   * @example
   * FinishController.restart({ preserveImage: true });
   */
  this.restart = (options) => {
    SelectionStateModel.clear(options);
    AnalyticsService.logEvent('Restart', options);
    $state.go('main');
  };

};
