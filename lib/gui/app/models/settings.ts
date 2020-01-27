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
import * as _ from 'lodash';

import * as packageJSON from '../../../../package.json';
import * as errors from '../../../shared/errors';
import * as localSettings from './local-settings';

const debug = _debug('etcher:models:settings');

const DEFAULT_SETTINGS: _.Dictionary<any> = {
	unsafeMode: false,
	errorReporting: true,
	unmountOnSuccess: true,
	validateWriteOnSuccess: true,
	trim: false,
	updatesEnabled:
		packageJSON.updates.enabled &&
		!_.includes(['rpm', 'deb'], packageJSON.packageType),
	lastSleptUpdateNotifier: null,
	lastSleptUpdateNotifierVersion: null,
	desktopNotifications: true,
};

let settings = _.cloneDeep(DEFAULT_SETTINGS);

/**
 * @summary Reset settings to their default values
 */
export async function reset(): Promise<void> {
	debug('reset');
	// TODO: Remove default settings from config file (?)
	settings = _.cloneDeep(DEFAULT_SETTINGS);
	return await localSettings.writeAll(settings);
}

/**
 * @summary Extend the current settings
 */
export async function assign(value: _.Dictionary<any>): Promise<void> {
	debug('assign', value);
	if (_.isNil(value)) {
		throw errors.createError({
			title: 'Missing settings',
		});
	}

	if (!_.isPlainObject(value)) {
		throw errors.createError({
			title: 'Settings must be an object',
		});
	}

	const newSettings = _.assign({}, settings, value);

	const updatedSettings = await localSettings.writeAll(newSettings);
	// NOTE: Only update in memory settings when successfully written
	settings = updatedSettings;
}

/**
 * @summary Extend the application state with the local settings
 */
export async function load(): Promise<void> {
	debug('load');
	const loadedSettings = await localSettings.readAll();
	_.assign(settings, loadedSettings);
}

/**
 * @summary Set a setting value
 */
export async function set(key: string, value: any): Promise<void> {
	debug('set', key, value);
	if (_.isNil(key)) {
		throw errors.createError({
			title: 'Missing setting key',
		});
	}

	if (!_.isString(key)) {
		throw errors.createError({
			title: `Invalid setting key: ${key}`,
		});
	}

	const previousValue = settings[key];
	settings[key] = value;
	try {
		await localSettings.writeAll(settings);
	} catch (error) {
		// Revert to previous value if persisting settings failed
		settings[key] = previousValue;
		throw error;
	}
}

/**
 * @summary Get a setting value
 */
export function get(key: string): any {
	return _.cloneDeep(_.get(settings, [key]));
}

/**
 * @summary Check if setting value exists
 */
export function has(key: string): boolean {
	return settings[key] != null;
}

/**
 * @summary Get all setting values
 */
export function getAll() {
	debug('getAll');
	return _.cloneDeep(settings);
}

/**
 * @summary Get the default setting values
 */
export function getDefaults() {
	debug('getDefaults');
	return _.cloneDeep(DEFAULT_SETTINGS);
}
