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

import {
	assign,
	flow,
	invoke,
	isEmpty,
	isError,
	isNil,
	isPlainObject,
	isString,
	toString,
	trim,
} from 'lodash';

import { Dict } from './utils';

const INDENTATION_SPACES = 2;

/**
 * @summary Human-friendly error messages
 */
export const HUMAN_FRIENDLY: Dict<{
	title: (error?: { path?: string }) => string;
	description: (error?: any) => string;
}> = {
	ENOENT: {
		title: (error: { path: string }) =>
			`No such file or directory: ${error.path}`,
		description: () => "The file you're trying to access doesn't exist",
	},
	EPERM: {
		title: () => "You're not authorized to perform this operation",
		description: () =>
			'Please ensure you have necessary permissions for this task',
	},
	EACCES: {
		title: () => "You don't have access to this resource",
		description: () =>
			'Please ensure you have necessary permissions to access this resource',
	},
	ENOMEM: {
		title: () => 'Your system ran out of memory',
		description: () =>
			'Please make sure your system has enough available memory for this task',
	},
};

/**
 * @summary Get user friendly property from an error
 * @function
 * @private
 *
 * @param {Error} error - error
 * @param {String} property - HUMAN_FRIENDLY property
 * @returns {(String|Undefined)} user friendly message
 *
 * @example
 * const error = new Error('My error');
 * error.code = 'ENOMEM';
 *
 * const friendlyDescription = getUserFriendlyMessageProperty(error, 'description');
 *
 * if (friendlyDescription) {
 *   console.log(friendlyDescription);
 * }
 */
function getUserFriendlyMessageProperty(
	error: { code?: string; path?: string },
	property: 'title' | 'description',
): string | null {
	const code = error.code;
	if (!isString(code)) {
		return null;
	}
	return invoke(HUMAN_FRIENDLY, [code, property], error);
}

/**
 * @summary Check if a string is blank
 * @function
 * @private
 *
 * @param {String} string - string
 * @returns {Boolean} whether the string is blank
 *
 * @example
 * if (isBlank('   ')) {
 *   console.log('The string is blank');
 * }
 */
const isBlank = flow([trim, isEmpty]);

/**
 * @summary Get the title of an error
 * @function
 * @public
 *
 * @description
 * Try to get as much information as possible about the error
 * rather than falling back to generic messages right away.
 *
 * @param {Error} error - error
 * @returns {String} error title
 *
 * @example
 * const error = new Error('Foo bar');
 * const title = errors.getTitle(error);
 * console.log(title);
 */
export function getTitle(error: Error | Dict<any>): string {
	if (!isError(error) && !isPlainObject(error) && !isNil(error)) {
		return toString(error);
	}

	const codeTitle = getUserFriendlyMessageProperty(error, 'title');
	if (!isNil(codeTitle)) {
		return codeTitle;
	}

	const message = error.message;
	if (!isBlank(message)) {
		return message;
	}

	const code = error.code;
	if (!isNil(code) && !isBlank(code)) {
		return `Error code: ${code}`;
	}

	return 'An error ocurred';
}

/**
 * @summary Get the description of an error
 * @function
 * @public
 *
 * @param {Error} error - error
 * @returns {String} error description
 *
 * @example
 * const error = new Error('Foo bar');
 * const description = errors.getDescription(error);
 * console.log(description);
 */
export function getDescription(error: {
	code?: string;
	description?: string;
	stack?: string;
}): string {
	if (!isError(error) && !isPlainObject(error)) {
		return '';
	}

	if (!isBlank(error.description)) {
		return error.description as string;
	}

	const codeDescription = getUserFriendlyMessageProperty(error, 'description');
	if (!isNil(codeDescription)) {
		return codeDescription;
	}

	if (error.stack) {
		return error.stack;
	}

	if (isEmpty(error)) {
		return '';
	}

	return JSON.stringify(error, null, INDENTATION_SPACES);
}

/**
 * @summary Create an error
 * @function
 * @public
 *
 * @param {Object} options - options
 * @param {String} options.title - error title
 * @param {String} [options.description] - error description
 * @param {Boolean} [options.report] - report error
 * @returns {Error} error
 *
 * @example
 * const error = errors.createError({
 *   title: 'Foo'
 *   description: 'Bar'
 * });
 *
 * throw error;
 */
export function createError(options: {
	title: string;
	description?: string;
	report?: boolean;
	code?: string;
}): Error & { description?: string; report?: boolean; code?: string } {
	if (isBlank(options.title)) {
		throw new Error(`Invalid error title: ${options.title}`);
	}

	const error: Error & {
		description?: string;
		report?: boolean;
		code?: string;
	} = new Error(options.title);
	error.description = options.description;

	if (!isNil(options.report) && !options.report) {
		error.report = false;
	}

	if (!isNil(options.code)) {
		error.code = options.code;
	}

	return error;
}

/**
 * @summary Create a user error
 * @function
 * @public
 *
 * @description
 * User errors represent invalid states that the user
 * caused, that are not errors on the application itself.
 * Therefore, user errors don't get reported to analytics
 * and error reporting services.
 *
 * @returns {Error} user error
 *
 * @example
 * const error = errors.createUserError({
 *   title: 'Foo',
 *   description: 'Bar'
 * });
 *
 * throw error;
 */
export function createUserError(options: {
	title: string;
	description: string;
	code?: string;
}): Error {
	return createError({
		title: options.title,
		description: options.description,
		report: false,
		code: options.code,
	});
}

/**
 * @summary Check if an error is an user error
 * @function
 * @public
 *
 * @param {Error} error - error
 * @returns {Boolean} whether the error is a user error
 *
 * @example
 * const error = errors.createUserError('Foo', 'Bar');
 *
 * if (errors.isUserError(error)) {
 *   console.log('This error is a user error');
 * }
 */
export function isUserError(error: { report?: boolean }): boolean {
	return isNil(error.report) ? false : !error.report;
}

/**
 * @summary Convert an Error object to a JSON object
 * @function
 * @public
 *
 * @param {Error} error - error object
 * @returns {Object} json error
 *
 * @example
 * const error = errors.toJSON(new Error('foo'))
 *
 * console.log(error.message);
 * > 'foo'
 */
export function toJSON(
	error: Error & {
		description?: string;
		report?: boolean;
		code?: string;
		syscall?: string;
		errno?: string | number;
		stdout?: string;
		stderr?: string;
		device?: any;
	},
) {
	return {
		name: error.name,
		message: error.message,
		description: error.description,
		stack: error.stack,
		report: error.report,
		code: error.code,
		syscall: error.syscall,
		errno: error.errno,
		stdout: error.stdout,
		stderr: error.stderr,
		device: error.device,
	};
}

/**
 * @summary Convert a JSON object to an Error object
 * @function
 * @public
 *
 * @param {Error} json - json object
 * @returns {Object} error object
 *
 * @example
 * const error = errors.fromJSON(errors.toJSON(new Error('foo')));
 *
 * console.log(error.message);
 * > 'foo'
 */
export function fromJSON(json: Dict<any>): Error {
	return assign(new Error(json.message), json);
}
