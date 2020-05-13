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

import * as _ from 'lodash';
import * as path from 'path';
import * as SimpleProgressWebpackPlugin from 'simple-progress-webpack-plugin';
import { BannerPlugin } from 'webpack';
import * as nodeExternals from 'webpack-node-externals';

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

const commonConfig = {
	mode: 'production',
	optimization: {
		minimize: false,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
			},
		],
	},
	resolve: {
		extensions: ['.json', '.ts', '.tsx'],
	},
	plugins: [
		new SimpleProgressWebpackPlugin({
			format: process.env.WEBPACK_PROGRESS || 'verbose',
		}),
	],
	output: {
		path: path.join(__dirname, 'generated'),
		filename: '[name].js',
	},
};

const guiConfig = {
	...commonConfig,
	target: 'electron-renderer',
	node: {
		__dirname: true,
		__filename: true,
	},
	externals: [
		nodeExternals(),

		// '../../../package.json' because we are in 'lib/gui/app/index.html'
		externalPackageJson('../../../package.json'),
	],
	entry: {
		gui: path.join(__dirname, 'lib', 'gui', 'app', 'app.ts'),
	},
	devtool: 'source-map',
	plugins: [
		...commonConfig.plugins,
		// Remove "Download the React DevTools for a better development experience" message
		new BannerPlugin({
			banner: '__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };',
			raw: true,
		}),
	],
};

const etcherConfig = {
	...commonConfig,
	target: 'electron-main',
	node: {
		__dirname: false,
		__filename: true,
	},
	externals: [
		nodeExternals(),

		// '../package.json' because we are in 'generated/etcher.js'
		externalPackageJson('../package.json'),
	],
	entry: {
		etcher: path.join(__dirname, 'lib', 'start.ts'),
	},
};

module.exports = [guiConfig, etcherConfig];
