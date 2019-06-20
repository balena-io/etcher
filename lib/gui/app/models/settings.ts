/*
 * Copyright 2016 resin.io
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

import * as debug_ from 'debug';
import { cloneDeep, isPlainObject } from 'lodash';

import { createError } from '../modules/errors';
import { Dict } from '../modules/utils';
import { readAll, writeAll } from './local-settings';

import * as packageJSON from '../../../../package.json';

const debug = debug_('etcher:models:settings');

const DEFAULT_SETTINGS = {
	unsafeMode: false,
	errorReporting: true,
	unmountOnSuccess: true,
	validateWriteOnSuccess: true,
	trim: false,
	updatesEnabled:
		packageJSON.updates.enabled &&
		!['rpm', 'deb'].includes(packageJSON.packageType),
	lastSleptUpdateNotifier: null,
	lastSleptUpdateNotifierVersion: null,
	desktopNotifications: true,
};

let settings: Dict<any> = cloneDeep(DEFAULT_SETTINGS);

export async function reset(): Promise<void> {
	debug('reset');
	// TODO: Remove default settings from config file (?)
	settings = cloneDeep(DEFAULT_SETTINGS);
	await writeAll(settings);
}

export async function assign(value: any): Promise<void> {
	debug('assign', value);
	if (!isPlainObject(value)) {
		throw createError({ title: 'Settings must be an object' });
	}
	const newSettings = { ...settings, ...value };
	const updatedSettings = await writeAll(newSettings);
	// NOTE: Only update in memory settings when successfully written
	settings = updatedSettings;
}

export async function load(): Promise<any> {
	debug('load');
	const loadedSettings = await readAll();
	settings = { ...settings, ...loadedSettings };
	return settings;
}

export async function set(key: string, value: any): Promise<void> {
	debug('set', key, value);
	if (typeof key !== 'string') {
		throw createError({ title: `Invalid setting key: ${key}` });
	}
	const previousValue = settings[key];
	settings[key] = value;
	try {
		await writeAll(settings);
	} catch (error) {
		// Revert to previous value if persisting settings failed
		settings[key] = previousValue;
		throw error;
	}
}

export function get(key: string): any {
	return cloneDeep(settings[key]);
}

export function has(key: string): boolean {
	return settings[key] !== undefined;
}

export function getAll(): any {
	debug('getAll');
	return cloneDeep(settings);
}

export function getDefaults(): any {
	debug('getDefaults');
	return cloneDeep(DEFAULT_SETTINGS);
}
