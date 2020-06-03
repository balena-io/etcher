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

// @ts-ignore @types for copy-webpack-plugin@6.0.1 not released yet
import * as CopyPlugin from 'copy-webpack-plugin';
import { readdirSync } from 'fs';
import * as _ from 'lodash';
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as os from 'os';
import outdent from 'outdent';
import * as path from 'path';
import { env } from 'process';
import * as SimpleProgressWebpackPlugin from 'simple-progress-webpack-plugin';
import * as TerserPlugin from 'terser-webpack-plugin';
import { BannerPlugin, NormalModuleReplacementPlugin } from 'webpack';

/**
 * Don't webpack package.json as mixpanel & sentry tokens
 * will be inserted in it after webpacking
 */
function externalPackageJson(packageJsonPath: string) {
	return (
		_context: string,
		request: string,
		callback: (error?: Error | null, result?: string) => void,
	) => {
		if (_.endsWith(request, 'package.json')) {
			return callback(null, `commonjs ${packageJsonPath}`);
		}
		return callback();
	};
}

function platformSpecificModule(
	platform: string,
	module: string,
	replacement = '{}',
) {
	// Resolves module on platform, otherwise resolves the replacement
	return (
		_context: string,
		request: string,
		callback: (error?: Error, result?: string, type?: string) => void,
	) => {
		if (request === module && os.platform() !== platform) {
			callback(undefined, replacement);
			return;
		}
		callback();
	};
}

function renameNodeModules(resourcePath: string) {
	// electron-builder excludes the node_modules folder even if you specifically include it
	// Work around by renaming it to "modules"
	// See https://github.com/electron-userland/electron-builder/issues/4545
	return (
		path
			.relative(__dirname, resourcePath)
			.replace('node_modules', 'modules')
			// file-loader expects posix paths, even on Windows
			.replace(/\\/g, '/')
	);
}

function findLzmaNativeBindingsFolder(): string {
	const files = readdirSync(path.join('node_modules', 'lzma-native'));
	const bindingsFolder = files.find(
		(f) =>
			f.startsWith('binding-') &&
			f.endsWith(env.npm_config_target_arch || os.arch()),
	);
	if (bindingsFolder === undefined) {
		throw new Error('Could not find lzma_native binding');
	}
	return bindingsFolder;
}

const LZMA_BINDINGS_FOLDER = findLzmaNativeBindingsFolder();

interface ReplacementRule {
	search: string;
	replace: string | (() => string);
}

function replace(test: RegExp, ...replacements: ReplacementRule[]) {
	return {
		loader: 'string-replace-loader',
		// Handle windows path separators
		test: new RegExp(test.source.replace(/\\\//g, '(\\/|\\\\)')),
		options: { multiple: replacements.map((r) => ({ ...r, strict: true })) },
	};
}

const commonConfig = {
	mode: 'production',
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: false,
					mangle: false,
					output: {
						beautify: true,
						comments: false,
						ecma: 2018,
					},
				},
				extractComments: false,
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
			},
			// force axios to use http backend (not xhr) to support streams
			replace(/node_modules\/axios\/lib\/defaults\.js$/, {
				search: './adapters/xhr',
				replace: './adapters/http',
			}),
			// remove bindings magic from drivelist
			replace(
				/node_modules\/drivelist\/js\/index\.js$/,
				{
					search: 'require("bindings");',
					replace: "require('../build/Release/drivelist.node')",
				},
				{
					search: "bindings('drivelist')",
					replace: 'bindings',
				},
			),
			// remove node-pre-gyp magic from lzma-native
			replace(/node_modules\/lzma-native\/index\.js$/, {
				search: 'require(binding_path)',
				replace: () => {
					return `require('./${path.posix.join(
						LZMA_BINDINGS_FOLDER,
						'lzma_native.node',
					)}')`;
				},
			}),
			// remove node-pre-gyp magic from usb
			replace(/node_modules\/@balena.io\/usb\/usb\.js$/, {
				search: 'require(binding_path)',
				replace: "require('./build/Release/usb_bindings.node')",
			}),
			// remove bindings magic from ext2fs
			replace(/node_modules\/ext2fs\/lib\/(ext2fs|binding)\.js$/, {
				search: "require('bindings')('bindings')",
				replace: "require('../build/Release/bindings.node')",
			}),
			// remove bindings magic from mountutils
			replace(/node_modules\/mountutils\/index\.js$/, {
				search: outdent`
					require('bindings')({
					  bindings: 'MountUtils',
					  /* eslint-disable camelcase */
					  module_root: __dirname
					  /* eslint-enable camelcase */
					})
				`,
				replace: "require('./build/Release/MountUtils.node')",
			}),
			// remove bindings magic from winusb-driver-generator
			replace(/node_modules\/winusb-driver-generator\/index\.js$/, {
				search: outdent`
					require('bindings')({
					  bindings: 'Generator',
					  /* eslint-disable camelcase */
					  module_root: __dirname
					  /* eslint-enable camelcase */
					});
				`,
				replace: "require('./build/Release/Generator.node')",
			}),
			// Use the copy of blobs in the generated folder and rename node_modules -> modules
			// See the renameNodeModules function above
			replace(/node_modules\/node-raspberrypi-usbboot\/build\/index\.js$/, {
				search:
					"return yield readFile(Path.join(__dirname, '..', 'blobs', filename));",
				replace: outdent`
					const { app, remote } = require('electron');
					return yield readFile(Path.join((app || remote.app).getAppPath(), 'generated', __dirname.replace('node_modules', 'modules'), '..', 'blobs', filename));
				`,
			}),
			// Copy native modules to generated folder
			{
				test: /\.node$/,
				use: [
					{
						loader: 'native-addon-loader',
						options: { name: renameNodeModules },
					},
				],
			},
		],
	},
	resolve: {
		extensions: ['.node', '.js', '.json', '.ts', '.tsx'],
	},
	plugins: [
		new SimpleProgressWebpackPlugin({
			format: process.env.WEBPACK_PROGRESS || 'verbose',
		}),
		// Force axios to use http.js, not xhr.js as we need stream support
		// (it's package.json file replaces http with xhr for browser targets).
		new NormalModuleReplacementPlugin(
			/node_modules\/axios\/lib\/adapters\/xhr\.js/,
			'./http.js',
		),
	],
	output: {
		path: path.join(__dirname, 'generated'),
		filename: '[name].js',
	},
	externals: [
		// '../package.json' because we are in 'generated'
		externalPackageJson('../package.json'),
		// Only exists on windows
		platformSpecificModule('win32', 'winusb-driver-generator'),
		// Not needed but required by resin-corvus > os-locale > execa > cross-spawn
		platformSpecificModule('none', 'spawn-sync'),
		// Not needed as we replace all requires for it
		platformSpecificModule('none', 'node-pre-gyp', '{ find: () => {} }'),
		// Not needed as we replace all requires for it
		platformSpecificModule('none', 'bindings'),
	],
};

const guiConfigCopyPatterns = [
	{
		from: 'node_modules/node-raspberrypi-usbboot/blobs',
		to: 'modules/node-raspberrypi-usbboot/blobs',
	},
];

if (os.platform() === 'win32') {
	// liblzma.dll is required on Windows for lzma-native
	guiConfigCopyPatterns.push({
		from: `node_modules/lzma-native/${LZMA_BINDINGS_FOLDER}/liblzma.dll`,
		to: `modules/lzma-native/${LZMA_BINDINGS_FOLDER}/liblzma.dll`,
	});
}

const guiConfig = {
	...commonConfig,
	target: 'electron-renderer',
	node: {
		__dirname: true,
		__filename: true,
	},
	entry: {
		gui: path.join(__dirname, 'lib', 'gui', 'app', 'app.ts'),
	},
	plugins: [
		...commonConfig.plugins,
		// Remove "Download the React DevTools for a better development experience" message
		new BannerPlugin({
			banner: '__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };',
			raw: true,
		}),
		new CopyPlugin({ patterns: guiConfigCopyPatterns }),
	],
};

const etcherConfig = {
	...commonConfig,
	target: 'electron-main',
	node: {
		__dirname: false,
		__filename: true,
	},
	entry: {
		etcher: path.join(__dirname, 'lib', 'start.ts'),
	},
};

const cssConfig = {
	mode: 'production',
	optimization: {
		minimize: false,
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: 'css-loader',
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								fiber: false,
							},
						},
					},
				],
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
				loader: 'file-loader',
				options: { name: renameNodeModules },
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({ filename: '[name].css' }),
		new CopyPlugin({
			patterns: [
				{ from: 'lib/gui/app/index.html', to: 'index.html' },
				// electron-builder doesn't bundle folders named "assets"
				// See https://github.com/electron-userland/electron-builder/issues/4545
				{ from: 'lib/gui/assets', to: 'media' },
				{ from: 'assets/icon.png', to: 'media/icon.png' },
			],
		}),
	],
	entry: {
		index: path.join(__dirname, 'lib', 'gui', 'app', 'scss', 'main.scss'),
	},
	output: {
		path: path.join(__dirname, 'generated'),
	},
};

module.exports = [cssConfig, guiConfig, etcherConfig];
