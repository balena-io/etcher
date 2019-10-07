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

const os = require('os')
const path = require('path')
const { createLoader } = require('simple-functional-loader')
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin')

// eslint-disable-next-line func-style,require-jsdoc,space-before-function-paren
function platformSpecificModule(platform, module) {
  // Resolves module on platform, otherwise resolves an empty file
  return (context, request, callback) => {
    if ((request === module) && (os.platform() !== platform)) {
      callback(null, `commonjs ${path.resolve(__dirname, 'lib', 'nothing')}`)
      return
    }
    callback()
  }
}

function fakeBindings(opts) {
  // TODO: elevator.node (windows only)
  const MAPPING = {
    MountUtils: 'mountutils/build/Release/MountUtils.node',
    bindings: 'ext2fs/build/Release/bindings.node',
    drivelist: 'drivelist/build/Release/drivelist.node',
  }
  if (typeof opts === 'string') {
    opts = { bindings: opts }
  }
  const { bindings, module_root } = opts;
  return __non_webpack_require__(MAPPING[bindings]);
}

const fakeNodePreGypFind = (package_json_path, opts) => {
  // Return an empty string as we will replace the line that requires the native module anyway
  return '';
}

function externalNativeModules(context, request, callback) {
  if (request.toLowerCase().search('mountutils') !== -1 || context.toLowerCase().search('mountutils') !== -1) {
    console.log('walala', context, request);
  }
  // TODO
  if ((context === '/home/alexis/dev/resin.io/etcher/node_modules/xxhash/lib') && (request === '../build/Release/hash')) {
    callback(null, `commonjs xxhash/build/Release/hash`)
  } else {
    callback()
  }
}

const commonConfig = {
  mode: 'production',
  optimization: {
    // Minification breaks angular.
    minimize: false
  },
  module: {
    rules: [
      {
        // remove node-pre-gyp magic from lzma-native
        test: /lzma\-native\/index\.js$/,
        loader: "string-replace-loader",
        options: {
          search: 'require\(binding_path\)',
          // TODO: automatically find version
          replace: '__non_webpack_require__("lzma-native/binding-v4.0.5-electron-v6.0-linux-x64/lzma_native.node")',
          strict: true,
        },
      },
      {
        // remove node-pre-gyp magic from usb
        test: /usb\/usb\.js$/,
        loader: "string-replace-loader",
        options: {
          search: 'require\(binding_path\)',
          replace: '__non_webpack_require__("usb/build/Release/usb_bindings.node")',
          strict: true,
        },
      },
      {
        // Replaces node-pre-gyp find function with a mock one
        test: /node-pre-gyp\/lib\/node-pre-gyp\.js$/,
        use: createLoader(function(source, map) {
          return `module.exports = { find: ${fakeNodePreGypFind.toString()} }`;
        }),
      },
      {
        test: /bindings\/bindings\.js$/,
        use: createLoader(function(source, map) {
          return `module.exports = ${fakeBindings.toString()}`;
        }),
      },
      {
        // these files require aws-sdk which is not installed
        test: /node-pre-gyp\/lib\/(publish|unpublish|info)\.js$/,
        use: createLoader(function(source, map) {
          return '';
        }),
      },
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
        include: [ path.resolve(__dirname, 'lib', 'gui', 'app') ],
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
    extensions: [ '.js', '.jsx', '.json', '.ts', '.tsx', '.node' ]
  },
  plugins: [
    new SimpleProgressWebpackPlugin({
      format: process.env.WEBPACK_PROGRESS || 'verbose'
    })
  ],
  externals: [
    platformSpecificModule('win32', 'winusb-driver-generator'),
    externalNativeModules,
  ],
  output: {
    path: path.join(__dirname, 'generated'),
    filename: '[name].js',
  },
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
  },
}

module.exports = [
  guiConfig,
  etcherConfig,
]
