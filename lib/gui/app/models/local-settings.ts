/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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

import { app, remote } from 'electron';
import { readFile, unlink, writeFile } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

/**
 * @summary Number of spaces to indent JSON output with
 * @type {Number}
 * @constant
 */
const JSON_INDENT = 2;

/**
 * @summary Userdata directory path
 * @description
 * Defaults to the following:
 * - `%APPDATA%/etcher` on Windows
 * - `$XDG_CONFIG_HOME/etcher` or `~/.config/etcher` on Linux
 * - `~/Library/Application Support/etcher` on macOS
 * See https://electronjs.org/docs/api/app#appgetpathname
 * @constant
 * @type {String}
 */
// NOTE: The ternary is due to this module being loaded both,
// Electron's main process and renderer process
const USER_DATA_DIR = (app || remote.app).getPath('userData');

/**
 * @summary Configuration file path
 * @type {String}
 * @constant
 */
const CONFIG_PATH = join(USER_DATA_DIR, 'config.json');

/**
 * @summary Read a local config.json file
 * @function
 * @private
 *
 * @param {String} filename - file path
 * @fulfil {Object} - settings
 * @returns {Promise}
 *
 * @example
 * readConfigFile('config.json').then((settings) => {
 *   console.log(settings)
 * })
 */
async function readConfigFile(filename: string): Promise<any> {
	let contents = '{}';
	try {
		contents = await readFileAsync(filename, { encoding: 'utf8' });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return {};
		}
		throw error;
	}
	try {
		return JSON.parse(contents);
	} catch (error) {
		console.error(error);
		return {};
	}
}

/**
 * @summary Write to the local configuration file
 * @function
 * @private
 *
 * @param {String} filename - file path
 * @param {Object} data - data
 * @fulfil {Object} data - data
 * @returns {Promise}
 *
 * @example
 * writeConfigFile('config.json', { something: 'good' })
 *   .then(() => {
 *     console.log('data written')
 *   })
 */
async function writeConfigFile(filename: string, data: any) {
	const contents = JSON.stringify(data, null, JSON_INDENT);
	await writeFileAsync(filename, contents);
	return data;
}

/**
 * @summary Read all local settings
 * @function
 * @public
 *
 * @fulfil {Object} - local settings
 * @returns {Promise}
 *
 * @example
 * localSettings.readAll().then((settings) => {
 *   console.log(settings);
 * });
 */
export async function readAll(): Promise<any> {
	return await readConfigFile(CONFIG_PATH);
}

/**
 * @summary Write local settings
 * @function
 * @public
 *
 * @param {Object} settings - settings
 * @fulfil {Object} settings - settings
 * @returns {Promise}
 *
 * @example
 * localSettings.writeAll({
 *   foo: 'bar'
 * }).then(() => {
 *   console.log('Done!');
 * });
 */
export async function writeAll(settings: any) {
	return await writeConfigFile(CONFIG_PATH, settings);
}

/**
 * @summary Clear the local settings
 * @function
 * @private
 *
 * @description
 * Exported for testing purposes
 *
 * @returns {Promise}
 *
 * @example
 * localSettings.clear().then(() => {
 *   console.log('Done!');
 * });
 */
export async function clear(): Promise<void> {
	await unlinkAsync(CONFIG_PATH);
}
