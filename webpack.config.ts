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
import * as TerserPlugin from 'terser-webpack-plugin';
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
		],
	},
	resolve: {
		extensions: ['.js', '.json', '.ts', '.tsx'],
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
		new CopyPlugin({
			patterns: [
				{ from: 'lib/gui/app/index.html', to: 'index.html' },
				// electron-builder doesn't bundle folders named "assets"
				// See https://github.com/electron-userland/electron-builder/issues/4545
				{ from: 'assets/icon.png', to: 'media/icon.png' },
			],
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
