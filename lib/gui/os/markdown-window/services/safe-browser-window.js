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

const electron = require('electron');

module.exports = function() {

  /**
   * @summary Get inline HTML URL
   * @function
   * @private
   *
   * @description
   * This function builds a valid URL that contains
   * the HTML content of the page inlined.
   * We do this to cope with the fact we disable the ability
   * for our browser window to load external resources
   * See https://gist.github.com/dannvix/dc0efdbb75bf79a79d1c
   *
   * @param {String} html - HTML string
   * @returns {String} html URL
   *
   * @example
   * const url = OSMarkdownWindowSafeBrowserWindowService.getInlineHtmlURL('<h1>Hello world!</h1>');
   * mySafeBrowserWindow.loadURL(url);
   */
  this.getInlineHtmlURL = (html) => {
    return `data:text/html;charset=utf-8,${encodeURI(html)}`;
  };

  /**
   * @summary Create a "safe" BrowserWindow
   * @function
   * @public
   *
   * @description
   * By "safe" browser window, we mean an Electron WebView
   * that has many features, such as Node Integration, JavaScript
   * support, external resources loading, etc completely disabled.
   *
   * We automatically attach a `closed` listener to get the window
   * garbage collected, so you don't need to do that yourself.
   *
   * @param {Object} options - options
   * @param {Number} options.width - browser window width
   * @param {Number} options.height - browser window height
   * @param {String} options.title - browser window title
   * @returns {Object} safe browser window
   *
   * @example
   * const safeBrowserWindow = OSMarkdownWindowSafeBrowserWindowService.create({
   *   width: 800,
   *   height: 600,
   *   title: 'My safe window!'
   * });
   *
   * safeBrowserWindow.loadURL('https://www.google.com');
   */
  this.create = (options) => {
    const currentBrowserWindow = electron.remote.getCurrentWindow();

    let safeBrowserWindow = new electron.remote.BrowserWindow({
      width: options.width,
      height: options.height,
      title: options.title,
      parent: currentBrowserWindow,

      // Disable most WebView features for security purposes
      webPreferences: {
        nodeIntegration: false,
        javascript: false,
        webgl: false,
        webaudio: false,
        plugins: false
      }

    });

    safeBrowserWindow.on('closed', () => {
      safeBrowserWindow = null;
    });

    return safeBrowserWindow;
  };

  /**
   * @summary Load HTML straight to a safe browser window
   * @function
   * @public
   *
   * @param {Object} safeBrowserWindow - "safe" browser window
   * @param {String} html - HTML string
   *
   * @example
   * OSMarkdownWindowSafeBrowserWindowService.loadHTML(mySafeBrowserWindow, '<h1>Hello world!</h1>');
   */
  this.loadHTML = (safeBrowserWindow, html) => {
    const url = this.getInlineHtmlURL(html);
    safeBrowserWindow.loadURL(url);
  };

};
