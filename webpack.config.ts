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
import * as _ from 'lodash';
import * as path from 'path';
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
		],
	},
	resolve: {
		extensions: ['.js', '.json', '.ts', '.tsx'],
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
	],
};

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

export default [guiConfig, etcherConfig];
