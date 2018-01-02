/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

'use strict'

const _ = require('lodash')
const path = require('path')

module.exports = {
  target: 'electron-main',
  node: {
    __dirname: true,
    __filename: true
  },
  entry: {
    gui: path.join(__dirname, 'lib', 'gui', 'app', 'app.js')
  },
  output: {
    path: path.join(__dirname, 'generated'),
    filename: '[name].js'
  },
  externals: [
    (context, request, callback) => {
      // We want to keep the SDK code outside the GUI bundle.
      // This piece of code allows us to run the GUI directly
      // on the tree (for testing purposes) or inside a generated
      // bundle (for production purposes), by translating
      // relative require paths within the bundle.
      if (/\.\/(shared|image-stream)/i.test(request)) {
        return callback(null, `commonjs ../../lib/${_.replace(request, /(\.\.\/)*/, '')}`)
      }

      return callback()
    }
  ],
  module: {
    rules: [
      {
        test: /\.js?$/,
        include: [ path.resolve(__dirname, 'lib/gui') ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ 'react', 'env', 'stage-0' ]
          }
        }
      },
      {
        test: /\.html$/,
        include: [ path.resolve(__dirname, 'lib/gui/app') ],
        use: {
          loader: 'html-loader'
        }
      }
    ]
  }
}
