/*
 * Copyright 2017 balena.io
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
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

/**
 * Don't webpack package.json as mixpanel & sentry tokens
 * will be inserted in it after webpacking
 *
 * @param {*} packageJsonPath - Path for the package.json file
 * @returns {void}
 *
 * @example webpack externals:
 * [
 *   externalPackageJson('./package.json')
 * ]
 */
const externalPackageJson = (packageJsonPath) => {
  return (_context, request, callback) => {
    if (_.endsWith(request, 'package.json')) {
      return callback(null, `commonjs ${packageJsonPath}`)
    }
    return callback()
  }
}

const commonConfig = {
  mode: 'production',
  optimization: {
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
  externals: [
    nodeExternals(),

    // '../../../package.json' because we are in 'lib/gui/app/index.html'
    externalPackageJson('../../../package.json')
  ],
  entry: {
    gui: path.join(__dirname, 'lib', 'gui', 'app', 'app.ts')
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
  externals: [
    nodeExternals(),

    // '../package.json' because we are in 'generated/etcher.js'
    externalPackageJson('../package.json')
  ],
  entry: {
    etcher: path.join(__dirname, 'lib', 'start.js')
  }
}

module.exports = [
  guiConfig,
  etcherConfig
]
