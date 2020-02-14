/*
 * Copyright 2017 balena.io
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

import * as electron from 'electron';
import { promises as fs } from 'fs';
import * as path from 'path';

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

const CONFIG_PATH = path.join(USER_DATA_DIR, 'config.json');

async function readConfigFile(filename: string): Promise<any> {
	let contents = '{}';
	try {
		contents = await fs.readFile(filename, { encoding: 'utf8' });
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
	try {
		return JSON.parse(contents);
	} catch (parseError) {
		console.error(parseError);
		return {};
	}
}

async function writeConfigFile(filename: string, data: any): Promise<any> {
	await fs.writeFile(filename, JSON.stringify(data, null, JSON_INDENT));
	return data;
}

export async function readAll(): Promise<any> {
	return await readConfigFile(CONFIG_PATH);
}

export async function writeAll(settings: any): Promise<any> {
	return await writeConfigFile(CONFIG_PATH, settings);
}

export async function clear(): Promise<void> {
	await fs.unlink(CONFIG_PATH);
}
