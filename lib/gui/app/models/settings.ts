/*
 * Copyright 2016 balena.io
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

import * as _debug from 'debug';
import * as electron from 'electron';
import * as _ from 'lodash';
import { promises as fs } from 'fs';
import { join } from 'path';

import * as packageJSON from '../../../../package.json';

const debug = _debug('etcher:models:settings');

const JSON_INDENT = 2;

/**
 * @summary Userdata directory path
 * @description
 * Defaults to the following:
 * - `%APPDATA%/etcher` on Windows
 * - `$XDG_CONFIG_HOME/etcher` or `~/.config/etcher` on Linux
 * - `~/Library/Application Support/etcher` on macOS
 * See https://electronjs.org/docs/api/app#appgetpathname
 *
 * NOTE: The ternary is due to this module being loaded both,
 * Electron's main process and renderer process
 */
const USER_DATA_DIR = electron.app
	? electron.app.getPath('userData')
	: electron.remote.app.getPath('userData');

const CONFIG_PATH = join(USER_DATA_DIR, 'config.json');

async function readConfigFile(filename: string): Promise<_.Dictionary<any>> {
	let contents = '{}';
	try {
		contents = await fs.readFile(filename, { encoding: 'utf8' });
	} catch (error) {
		// noop
	}
	try {
		return JSON.parse(contents);
	} catch (parseError) {
		console.error(parseError);
		return {};
	}
}

// exported for tests
export async function readAll() {
	return await readConfigFile(CONFIG_PATH);
}

// exported for tests
export async function writeConfigFile(
	filename: string,
	data: _.Dictionary<any>,
): Promise<void> {
	await fs.writeFile(filename, JSON.stringify(data, null, JSON_INDENT));
}

const DEFAULT_SETTINGS: _.Dictionary<any> = {
	errorReporting: true,
	unmountOnSuccess: true,
	validateWriteOnSuccess: true,
	updatesEnabled: !_.includes(['rpm', 'deb'], packageJSON.packageType),
	desktopNotifications: true,
	autoBlockmapping: true,
	decompressFirst: true,
};

const settings = _.cloneDeep(DEFAULT_SETTINGS);

async function load(): Promise<void> {
	debug('load');
	const loadedSettings = await readAll();
	_.assign(settings, loadedSettings);
}

const loaded = load();

export async function set(
	key: string,
	value: any,
	writeConfigFileFn = writeConfigFile,
): Promise<void> {
	debug('set', key, value);
	await loaded;
	const previousValue = settings[key];
	settings[key] = value;
	try {
		await writeConfigFileFn(CONFIG_PATH, settings);
	} catch (error) {
		// Revert to previous value if persisting settings failed
		settings[key] = previousValue;
		throw error;
	}
}

export async function get(key: string): Promise<any> {
	await loaded;
	return getSync(key);
}

export function getSync(key: string): any {
	return _.cloneDeep(settings[key]);
}

export async function getAll() {
	debug('getAll');
	await loaded;
	return _.cloneDeep(settings);
}
