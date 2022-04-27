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

import axios from 'axios';
import { app, remote } from 'electron';
import { Dictionary } from 'lodash';

import * as errors from './errors';

export function isValidPercentage(percentage: any): boolean {
	return typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
}

export function percentageToFloat(percentage: any) {
	if (!isValidPercentage(percentage)) {
		throw errors.createError({
			title: `Invalid percentage: ${percentage}`,
		});
	}
	return percentage / 100;
}

/**
 * @summary Get etcher configs stored online
 * @param {String} - url where config.json is stored
 */
export async function getConfig(configUrl?: string): Promise<Dictionary<any>> {
	configUrl = configUrl ?? 'https://balena.io/etcher/static/config.json';
	const response = await axios.get(configUrl, { responseType: 'json' });
	return response.data;
}

export async function delay(duration: number): Promise<void> {
	await new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
}

export function getAppPath(): string {
	return (
		(app || remote.app)
			.getAppPath()
			// With macOS universal builds, getAppPath() returns the path to an app.asar file containing an index.js file which will
			// include the app-x64 or app-arm64 folder depending on the arch.
			// We don't care about the app.asar file, we want the actual folder.
			.replace(/\.asar$/, () =>
				process.platform === 'darwin' ? '-' + process.arch : '',
			)
	);
}

export function isJson(jsonString: string) {
	try {
		JSON.parse(jsonString);
	} catch (e) {
		return false;
	}
	return true;
}
