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

import type { Configuration, ModuleOptions } from 'webpack';
import { resolve } from 'path';

import {
	BannerPlugin,
	IgnorePlugin,
	NormalModuleReplacementPlugin,
} from 'webpack';

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

const rules: Required<ModuleOptions>['rules'] = [
	// Add support for native node modules
	{
		// We're specifying native_modules in the test because the asset relocator loader generates a
		// "fake" .node file which is really a cjs file.
		test: /native_modules[/\\].+\.node$/,
		use: 'node-loader',
	},
	{
		test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
		parser: { amd: false },
		use: {
			loader: '@vercel/webpack-asset-relocator-loader',
			options: {
				outputAssetBase: 'native_modules',
			},
		},
	},
	{
		test: /\.tsx?$/,
		exclude: /(node_modules|\.webpack)/,
		use: {
			loader: 'ts-loader',
			options: {
				transpileOnly: true,
			},
		},
	},
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
	// force axios to use http backend (not xhr) to support streams
	replace(/node_modules\/axios\/lib\/defaults\.js$/, {
		search: './adapters/xhr',
		replace: './adapters/http',
	}),
];

export const rendererConfig: Configuration = {
	module: {
		rules,
	},
	plugins: [
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
		// Remove "Download the React DevTools for a better development experience" message
		new BannerPlugin({
			banner: '__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: true };',
			raw: true,
		}),
	],

	resolve: {
		extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
		alias: {
			// need to alias ws to the wrapper to avoid the browser fake version to be used
			ws: resolve(__dirname, 'node_modules/ws/wrapper.mjs'),
		},
	},
};

export const mainConfig: Configuration = {
	entry: {
		etcher: './lib/gui/etcher.ts',
	},
	module: {
		rules,
	},
	resolve: {
		extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
	},
};
