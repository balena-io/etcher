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

import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as request from 'request';
import * as tmp from 'tmp';
import { promisify } from 'util';

import * as errors from './errors';

const getAsync = promisify(request.get);

/**
 * @summary Minimum percentage value
 * @constant
 * @public
 * @type {Number}
 */
export const PERCENTAGE_MINIMUM = 0;

/**
 * @summary Maximum percentage value
 * @constant
 * @public
 * @type {Number}
 */
export const PERCENTAGE_MAXIMUM = 100;

/**
 * @summary Check if a percentage is valid
 * @function
 * @public
 *
 * @param {Number} percentage - percentage
 * @returns {Boolean} whether the percentage is valid
 *
 * @example
 * if (utils.isValidPercentage(85)) {
 *   console.log('The percentage is valid');
 * }
 */
export function isValidPercentage(percentage: number) {
	return _.every([
		_.isNumber(percentage),
		percentage >= exports.PERCENTAGE_MINIMUM,
		percentage <= exports.PERCENTAGE_MAXIMUM,
	]);
}

/**
 * @summary Convert a percentage to a float
 * @function
 * @public
 *
 * @param {Number} percentage - percentage
 * @returns {Number} float percentage
 *
 * @example
 * const value = utils.percentageToFloat(50);
 * console.log(value);
 * > 0.5
 */
export function percentageToFloat(percentage: number) {
	if (!isValidPercentage(percentage)) {
		throw errors.createError({
			title: `Invalid percentage: ${percentage}`,
		});
	}

	return percentage / PERCENTAGE_MAXIMUM;
}

/**
 * @summary Memoize a function
 * @function
 * @private
 *
 * @description
 * This workaround is needed to avoid AngularJS from getting
 * caught in an infinite digest loop when using `ngRepeat`
 * over a function that returns a mutable version of an
 * ImmutableJS object.
 *
 * The problem is that every time you call `myImmutableObject.toJS()`
 * you will get a new object, whose reference is different from
 * the one you previously got, even if the data is exactly the same.
 *
 * @param {Function} func - function that returns an ImmutableJS list
 * @param {Function} comparer - function to compare old and new args and state
 * @returns {Function} memoized function
 *
 * @example
 * const getList = () => {
 *   return Store.getState().toJS().myList;
 * };
 *
 * const memoizedFunction = memoize(getList, angular.equals);
 */
export function memoize(
	func: (...args: any[]) => any,
	comparer: (a: any, b: any) => boolean,
) {
	let previousTuples: any[] = [];

	return (...restArgs: any[]) => {
		let areArgsInTuple = false;
		let state = Reflect.apply(func, this, restArgs);

		previousTuples = _.map(previousTuples, ([oldArgs, oldState]) => {
			if (comparer(oldArgs, restArgs)) {
				areArgsInTuple = true;

				if (comparer(state, oldState)) {
					// Use the previously memoized state for this argument
					state = oldState;
				}

				// Update the tuple state
				return [oldArgs, state];
			}

			// Return the tuple unchanged
			return [oldArgs, oldState];
		});

		// Add the state associated with these args to be memoized
		if (!areArgsInTuple) {
			previousTuples.push([restArgs, state]);
		}

		return state;
	};
}

/**
 * @summary Check if obj has one or many specific props
 * @function
 * @public
 *
 * @param {Object} obj - object
 * @param {Array<String>} props - properties
 *
 * @returns {Boolean}
 *
 * @example
 * const doesIt = hasProps({ foo: 'bar' }, [ 'foo' ]);
 */
export function hasProps(obj: any, props: string[]) {
	return _.every(props, prop => {
		return _.has(obj, prop);
	});
}

/**
 * @summary Get etcher configs stored online
 * @param {String} - url where config.json is stored
 */
export async function getConfig(configUrl: string) {
	// @ts-ignore
	return (await getAsync(configUrl, { json: true })).body;
}

/**
 * @summary returns { path: String, cleanup: Function }
 * @function
 *
 * @param {Object} options - options
 *
 * @returns {Promise<{ path: String, cleanup: Function }>}
 *
 * @example
 * tmpFileAsync()
 *   .then({ path, cleanup } => {
 *     console.log(path)
 *     cleanup()
 *   });
 */
function tmpFileAsync(options: tmp.FileOptions) {
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
 * @function
 *
 * @param {Object} options - options
 *
 * @returns {Disposer<{ path: String, cleanup: Function }>}
 *
 * @example
 * await Bluebird.using(tmpFileDisposer(), ({ path }) => {
 *   console.log(path);
 * })
 */
export function tmpFileDisposer(options: tmp.FileOptions) {
	return Bluebird.resolve(tmpFileAsync(options)).disposer(({ cleanup }) => {
		cleanup();
	});
}

export interface Dict<T> {
	[key: string]: T;
}
