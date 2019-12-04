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

const path = require('path')
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

const commonConfig = {
  mode: 'production',
  optimization: {
    // Minification breaks angular.
    minimize: false
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [ path.resolve(__dirname, 'lib', 'gui') ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              [ '@babel/preset-env', { targets: { electron: '6' } } ]
            ],
            plugins: [ '@babel/plugin-proposal-function-bind' ],
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.html$/,
        use: 'html-loader'
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: [ '.js', '.jsx', '.json', '.ts', '.tsx' ]
  },
  plugins: [
    new SimpleProgressWebpackPlugin({
      format: process.env.WEBPACK_PROGRESS || 'verbose'
    })
  ],
  externals: [
    nodeExternals()
  ],
  output: {
    path: path.join(__dirname, 'generated'),
    filename: '[name].js'
  }
}

const guiConfig = {
  ...commonConfig,
  target: 'electron-renderer',
  node: {
    __dirname: true,
    __filename: true
  },
  entry: {
    gui: path.join(__dirname, 'lib', 'gui', 'app', 'app.js')
  },
  devtool: 'source-map'
}

const etcherConfig = {
  ...commonConfig,
  target: 'electron-main',
  node: {
    __dirname: false,
    __filename: true
  },
  entry: {
    etcher: path.join(__dirname, 'lib', 'start.js')
  }
}

module.exports = [
  guiConfig,
  etcherConfig
]
