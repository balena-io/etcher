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

module.exports = function($q, OSMarkdownWindowSafeBrowserWindowService, OSMarkdownWindowParserService) {

  /**
   * @summary Display a markdown window
   * @function
   * @public
   *
   * @description
   * This function safely displays a markdown document as a separate window,
   * having the current window as the parent.
   *
   * @param {String} markdown - markdown string
   * @param {Object} options - options
   * @param {Number} options.width - window width
   * @param {Number} options.height - window height
   * @param {String} options.title - window title
   * @param {String} options.stylesheetPath - path to stylesheet
   * @returns {Promise}
   *
   * @example
   * OSMarkdownWindowService.display('# Hello world!', {
   *   title: 'Hello from markdown!',
   *   width: 800,
   *   height: 600,
   *   stylesheetPath: 'my/style.css'
   * });
   */
  this.display = (markdown, options) => {
    return OSMarkdownWindowParserService.convertMarkdownToHtml(markdown, options.stylesheetPath).then((html) => {
      const markdownWindow = OSMarkdownWindowSafeBrowserWindowService.create(options);
      OSMarkdownWindowSafeBrowserWindowService.loadHTML(markdownWindow, html);
    });
  };

};
