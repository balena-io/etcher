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
        include: [ path.resolve(__dirname, 'lib/gui') ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              [ '@babel/preset-env', { targets: { electron: '3' } } ]
            ],
            plugins: [ '@babel/plugin-proposal-function-bind' ],
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.html$/,
        include: [ path.resolve(__dirname, 'lib/gui/app') ],
        use: {
          loader: 'html-loader'
        }
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
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
  ]
}

const guiConfig = _.assign(
  {},
  commonConfig,
  {
    node: {
      __dirname: true,
      __filename: true
    },
    target: 'electron-renderer',
    externals: [
      nodeExternals(),
      (context, request, callback) => {
        // eslint-disable-next-line lodash/prefer-lodash-method
        const absoluteContext = path.resolve(context)
        const absoluteNodeModules = path.resolve('node_modules')

        // We shouldn't rewrite any node_modules import paths
        // eslint-disable-next-line lodash/prefer-lodash-method
        if (!path.relative(absoluteNodeModules, absoluteContext).startsWith('..')) {
          return callback()
        }

        return callback()
      }
    ],
    entry: {
      gui: path.join(__dirname, 'lib', 'gui', 'app', 'app.js')
    },
    output: {
      path: path.join(__dirname, 'generated'),
      filename: '[name].js'
    }
  }
)

const etcherConfig = _.assign(
  {},
  commonConfig,
  {
    node: {
      __dirname: false,
      __filename: true
    },
    target: 'electron-main',
    externals: [
      nodeExternals(),
      (context, request, callback) => {
        // eslint-disable-next-line lodash/prefer-lodash-method
        const absoluteContext = path.resolve(context)
        const absoluteNodeModules = path.resolve('node_modules')

        // We shouldn't rewrite any node_modules import paths
        // eslint-disable-next-line lodash/prefer-lodash-method
        if (!path.relative(absoluteNodeModules, absoluteContext).startsWith('..')) {
          return callback()
        }

        return callback()
      }
    ],
    entry: {
      etcher: path.join(__dirname, 'lib', 'gui', 'etcher.js')
    },
    output: {
      path: path.join(__dirname, 'generated'),
      filename: '[name].js'
    }
  }
)

const childWriterConfig = _.assign(
  {},
  etcherConfig,
  {
    entry: {
      etcher: path.join(__dirname, 'lib', 'gui', 'app', 'modules', 'child-writer.js')
    },
    output: {
      path: path.join(__dirname, 'generated'),
      filename: 'child-writer.js'
    }
  }
)

module.exports = [
  guiConfig,
  etcherConfig,
  childWriterConfig
]
