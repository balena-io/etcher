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

import * as CopyPlugin from 'copy-webpack-plugin';
import { readdirSync } from 'fs';
import * as _ from 'lodash';
import * as os from 'os';
import outdent from 'outdent';
import * as path from 'path';
import { env } from 'process';
import * as SimpleProgressWebpackPlugin from 'simple-progress-webpack-plugin';
import * as TerserPlugin from 'terser-webpack-plugin';
import {
	BannerPlugin,
	IgnorePlugin,
	NormalModuleReplacementPlugin,
} from 'webpack';
import * as PnpWebpackPlugin from 'pnp-webpack-plugin';

import * as tsconfigRaw from './tsconfig.webpack.json';

/**
 * Don't webpack package.json as sentry tokens
 * will be inserted in it after webpacking
 */
function externalPackageJson(packageJsonPath: string) {
	return (
		{ request }: { context: string; request: string },
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
		{ request }: { context: string; request: string },
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
			// use the same name on all architectures so electron-builder can build a universal dmg on mac
			.replace(LZMA_BINDINGS_FOLDER, LZMA_BINDINGS_FOLDER_RENAMED)
			// file-loader expects posix paths, even on Windows
			.replace(/\\/g, '/')
	);
}

function findUsbPrebuild(): string[] {
	const usbPrebuildsFolder = path.join('node_modules', 'usb', 'prebuilds');
	const prebuildFolders = readdirSync(usbPrebuildsFolder);
	let bindingFile: string | undefined = 'node.napi.node';
	const platformFolder = prebuildFolders.find(
		(f) => f.startsWith(os.platform()) && f.indexOf(os.arch()) > -1,
	);
	if (platformFolder === undefined) {
		throw new Error(
			'Could not find usb prebuild. Should try fallback to node-gyp and use /build/Release instead of /prebuilds',
		);
	}

	const bindingFiles = readdirSync(
		path.join(usbPrebuildsFolder, platformFolder),
	);

	if (!bindingFiles.length) {
		throw new Error('Could not find usb prebuild for platform');
	}

	if (bindingFiles.length === 1) {
		bindingFile = bindingFiles[0];
	}

	// armv6 vs v7 in linux-arm and
	// glibc vs musl in linux-x64
	if (bindingFiles.length > 1) {
		bindingFile = bindingFiles.find((file) => {
			if (bindingFiles.indexOf('arm') > -1) {
				const process = require('process');
				return file.indexOf(process.config.variables.arm_version) > -1;
			} else {
				return file.indexOf('glibc') > -1;
			}
		});
	}

	if (bindingFile === undefined) {
		throw new Error('Could not find usb prebuild for platform');
	}

	return [platformFolder, bindingFile];
}

const [USB_BINDINGS_FOLDER, USB_BINDINGS_FILE] = findUsbPrebuild();

function findLzmaNativeBindingsFolder(): string {
	const files = readdirSync(
		path.join('node_modules', 'lzma-native', 'prebuilds'),
	);
	const bindingsFolder = files.find(
		(f) =>
			f.startsWith(os.platform()) &&
			f.endsWith(env.npm_config_target_arch || os.arch()),
	);
	if (bindingsFolder === undefined) {
		throw new Error('Could not find lzma_native binding');
	}
	return bindingsFolder;
}

const LZMA_BINDINGS_FOLDER = findLzmaNativeBindingsFolder();
const LZMA_BINDINGS_FOLDER_RENAMED = 'binding';

interface ReplacementRule {
	search: string;
	replace: string | (() => string);
}

function slashOrAntislash(pattern: RegExp): RegExp {
	return new RegExp(pattern.source.replace(/\\\//g, '(\\/|\\\\)'));
}

function replace(test: RegExp, ...replacements: ReplacementRule[]) {
	return {
		loader: 'string-replace-loader',
		// Handle windows path separators
		test: slashOrAntislash(test),
		options: { multiple: replacements.map((r) => ({ ...r, strict: true })) },
	};
}

const commonConfig = {
	mode: 'production',
	optimization: {
		moduleIds: 'natural',
		minimize: true,
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					compress: false,
					mangle: false,
					format: {
						comments: false,
						ecma: 2020,
					},
				},
				extractComments: false,
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				loader: 'file-loader',
				options: { name: renameNodeModules },
			},
			{
				test: /\.svg$/,
				use: '@svgr/webpack',
			},
			{
				test: /\.tsx?$/,
				use: [
					{
						loader: 'esbuild-loader',
						options: {
							loader: 'tsx',
							target: 'es2021',
							tsconfigRaw,
						},
					},
				],
			},
			// don't import WeakMap polyfill in deep-map-keys (required in corvus)
			replace(/node_modules\/deep-map-keys\/lib\/deep-map-keys\.js$/, {
				search: "var WeakMap = require('es6-weak-map');",
				replace: '',
			}),
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
			replace(
				/node_modules\/lzma-native\/index\.js$/,
				// remove node-pre-gyp magic from lzma-native
				{
					search: `require('node-gyp-build')(__dirname);`,
					replace: `require('./prebuilds/${LZMA_BINDINGS_FOLDER}/electron.napi.node')`,
				},
				// use regular stream module instead of readable-stream
				{
					search: "var stream = require('readable-stream');",
					replace: "var stream = require('stream');",
				},
			),
			// remove node-pre-gyp magic from usb
			replace(/node_modules\/usb\/dist\/usb\/bindings\.js$/, {
				search: `require('node-gyp-build')(path_1.join(__dirname, '..', '..'));`,
				replace: `require('../../prebuilds/${USB_BINDINGS_FOLDER}/${USB_BINDINGS_FILE}')`,
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
					"return await readFile(Path.join(__dirname, '..', 'blobs', filename));",
				replace: outdent`
					const { app, remote } = require('electron');
					return await readFile(
						Path.join(
							// With macOS universal builds, getAppPath() returns the path to an app.asar file containing an index.js file which will
							// include the app-x64 or app-arm64 folder depending on the arch.
							// We don't care about the app.asar file, we want the actual folder.
							(app || remote.app).getAppPath().replace(/\\.asar$/, () => process.platform === 'darwin' ? '-' + process.arch : ''),
							'generated',
							__dirname.replace('node_modules', 'modules'),
							'..',
							'blobs',
							filename
						)
					);
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
		PnpWebpackPlugin,
		new SimpleProgressWebpackPlugin({
			format: process.env.WEBPACK_PROGRESS || 'verbose',
		}),
		// Force axios to use http.js, not xhr.js as we need stream support
		// (its package.json file replaces http with xhr for browser targets).
		new NormalModuleReplacementPlugin(
			slashOrAntislash(/node_modules\/axios\/lib\/adapters\/xhr\.js/),
			'./http.js',
		),
		// Ignore `aws-crt` which is a dependency of (ultimately) `aws4-axios` which is used
		// by etcher-sdk and does a runtime check to its availability. We’re not currently
		// using the “assume role” functionality (AFAIU) of aws4-axios and we don’t care that
		// it’s not found, so force webpack to ignore the import.
		// See https://github.com/aws/aws-sdk-js-v3/issues/3025
		new IgnorePlugin({
			resourceRegExp: /^aws-crt$/,
		}),
	],
	resolveLoader: {
		plugins: [PnpWebpackPlugin.moduleLoader(module)],
	},
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
		from: `node_modules/lzma-native/prebuilds/${LZMA_BINDINGS_FOLDER}/liblzma.dll`,
		to: `modules/lzma-native/prebuilds/${LZMA_BINDINGS_FOLDER_RENAMED}/liblzma.dll`,
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
		gui: path.join(__dirname, 'lib', 'gui', 'app', 'renderer.ts'),
	},
	// entry: path.join(__dirname, 'lib', 'gui', 'app', 'renderer.ts'),
	plugins: [
		...commonConfig.plugins,
		new CopyPlugin({
			patterns: [
				{ from: 'lib/gui/app/index.html', to: 'index.html' },
				// electron-builder doesn't bundle folders named "assets"
				// See https://github.com/electron-userland/electron-builder/issues/4545
				{ from: 'assets/icon.png', to: 'media/icon.png' },
			],
		}),
		// Remove "Download the React DevTools for a better development experience" message
		new BannerPlugin({
			banner: '__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };',
			raw: true,
		}),
		new CopyPlugin({ patterns: guiConfigCopyPatterns }),
	],
};

const mainConfig = {
	...commonConfig,
	target: 'electron-main',
	node: {
		__dirname: false,
		__filename: true,
	},
};

const etcherConfig = {
	...mainConfig,
	entry: {
		etcher: path.join(__dirname, 'lib', 'gui', 'etcher.ts'),
	},
};

const childWriterConfig = {
	...mainConfig,
	entry: {
		'child-writer': path.join(
			__dirname,
			'lib',
			'gui',
			'modules',
			'child-writer.ts',
		),
	},
};

export default [guiConfig, etcherConfig, childWriterConfig];
