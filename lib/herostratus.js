/* The MIT License
 *
 * Copyright (c) 2015 Resin.io. https://resin.io.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var path = require('path');
var app = require('app');
var Menu = require('menu');
var Window = require('electron-window');
var elevate = require('./elevate');

app.on('window-all-closed', app.quit);

app.on('ready', function() {
  'use strict';

  // No menu bar
  Menu.setApplicationMenu(null);

  elevate.require(function(error) {

    if (error) {
      throw error;
    }

    var mainWindow = Window.createWindow({
      width: 800,
      height: 380,
      resizable: false,
      fullscreen: false
    });

    mainWindow.showUrl(path.join(__dirname, 'index.html'));
  });
});

