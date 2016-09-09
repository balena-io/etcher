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

const fs = require('fs');
const showdown = require('showdown');

module.exports = function($q) {

  /**
   * @summary Convert markdown to HTML
   * @function
   * @public
   *
   * @description
   * This function takes the path to a CSS stylesheet, and inlines it in
   * the resulting HTML so it plays nice with our "safe" browser windows.
   *
   * @param {String} markdown - markdown string
   * @param {String} stylesheetPath - path to stylesheet
   * @fulfil {String} - html
   * @returns {Promise}
   *
   * @example
   * OSMarkdownWindowParserService.convertMarkdownToHtml('# Hello world!', 'my/style.css').then((html) => {
   *   document.querySelector('html').innerHTML = html;
   * });
   */
  this.convertMarkdownToHtml = (markdown, stylesheetPath) => {
    return $q((resolve, reject) => {
      const converter = new showdown.Converter();
      const html = converter.makeHtml(markdown);

      // For security reasons, we're preventing the WebView from
      // loading external resources, so using the `<link>` tag
      // will not work. As a workaround, we inline all relevant
      // styles in `<style>` tags.

      fs.readFile(stylesheetPath, {
        encoding: 'utf8'
      }, (error, stylesheet) => {
        if (error) {
          return reject(error);
        }

        return resolve([
          '<style>',
          stylesheet,
          '</style>',
          html
        ].join('\n'));
      });
    });
  };

};
