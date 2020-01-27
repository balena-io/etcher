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

import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as request from 'request';
import * as tmp from 'tmp';
import { promisify } from 'util';

import * as errors from './errors';

const getAsync = promisify(request.get);

export function isValidPercentage(percentage: any): boolean {
	return _.every([_.isNumber(percentage), percentage >= 0, percentage <= 100]);
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
 * @summary Check if obj has one or many specific props
 */
export function hasProps(obj: any, props: string[]): boolean {
	return _.every(props, prop => {
		return _.has(obj, prop);
	});
}

/**
 * @summary Get etcher configs stored online
 * @param {String} - url where config.json is stored
 */
export async function getConfig(configUrl: string): Promise<any> {
	return (await getAsync({ url: configUrl, json: true })).body;
}

/**
 * @summary returns { path: String, cleanup: Function }
 *
 * @example
 * const {path, cleanup } = await tmpFileAsync()
 * console.log(path)
 * cleanup()
 */
function tmpFileAsync(
	options: tmp.FileOptions,
): Promise<{ path: string; cleanup: () => void }> {
	return new Promise((resolve, reject) => {
		tmp.file(options, (error, path, _fd, cleanup) => {
			if (error) {
				reject(error);
			} else {
				resolve({ path, cleanup });
			}
		});
	});
}

/**
 * @summary Disposer for tmpFileAsync, calls cleanup()
 *
 * @returns {Disposer<{ path: String, cleanup: Function }>}
 *
 * @example
 * await Bluebird.using(tmpFileDisposer(), ({ path }) => {
 *   console.log(path);
 * })
 */
export function tmpFileDisposer(
	options: tmp.FileOptions,
): Bluebird.Disposer<{ path: string; cleanup: () => void }> {
	return Bluebird.resolve(tmpFileAsync(options)).disposer(({ cleanup }) => {
		cleanup();
	});
}
