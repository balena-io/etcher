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

import * as _ from 'lodash';

function createErrorDetails(options: {
	title: string | ((error: Error) => string);
	description: string | ((error: Error) => string);
}): {
	title: (error: Error) => string;
	description: (error: Error) => string;
} {
	return _.pick(
		_.mapValues(options, (value) => {
			return _.isFunction(value) ? value : _.constant(value);
		}),
		['title', 'description'],
	);
}

/**
 * @summary Human-friendly error messages
 */
export const HUMAN_FRIENDLY = {
	ENOENT: createErrorDetails({
		title: (error: Error & { path: string }) => {
			return `No such file or directory: ${error.path}`;
		},
		description: "The file you're trying to access doesn't exist",
	}),
	EPERM: createErrorDetails({
		title: "You're not authorized to perform this operation",
		description: 'Please ensure you have necessary permissions for this task',
	}),
	EACCES: createErrorDetails({
		title: "You don't have access to this resource",
		description:
			'Please ensure you have necessary permissions to access this resource',
	}),
	ENOMEM: createErrorDetails({
		title: 'Your system ran out of memory',
		description:
			'Please make sure your system has enough available memory for this task',
	}),
};

/**
 * @summary Get user friendly property from an error
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
	error: Error,
	property: 'title' | 'description',
): string | null {
	const code = _.get(error, ['code']);

	if (_.isNil(code) || !_.isString(code)) {
		return null;
	}

	return _.invoke(HUMAN_FRIENDLY, [code, property], error);
}

const isBlank = _.flow([_.trim, _.isEmpty]);

/**
 * @summary Get the title of an error
 *
 * @description
 * Try to get as much information as possible about the error
 * rather than falling back to generic messages right away.
 */
export function getTitle(error: Error): string {
	if (!_.isError(error) && !_.isPlainObject(error) && !_.isNil(error)) {
		return _.toString(error);
	}

	const codeTitle = getUserFriendlyMessageProperty(error, 'title');
	if (!_.isNil(codeTitle)) {
		return codeTitle;
	}

	const message = _.get(error, ['message']);
	if (!isBlank(message)) {
		return message;
	}

	const code = _.get(error, ['code']);
	if (!_.isNil(code) && !isBlank(code)) {
		return `Error code: ${code}`;
	}

	return 'An error ocurred';
}

/**
 * @summary Get the description of an error
 */
export function getDescription(
	error: Error & { description?: string },
	options: { userFriendlyDescriptionsOnly?: boolean } = {},
): string {
	_.defaults(options, {
		userFriendlyDescriptionsOnly: false,
	});

	if (!_.isError(error) && !_.isPlainObject(error)) {
		return '';
	}

	if (!isBlank(error.description)) {
		return error.description as string;
	}

	const codeDescription = getUserFriendlyMessageProperty(error, 'description');
	if (!_.isNil(codeDescription)) {
		return codeDescription;
	}

	if (options.userFriendlyDescriptionsOnly) {
		return '';
	}

	if (error.stack) {
		return error.stack;
	}

	if (_.isEmpty(error)) {
		return '';
	}

	const INDENTATION_SPACES = 2;
	return JSON.stringify(error, null, INDENTATION_SPACES);
}

/**
 * @summary Create an error
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

	if (!_.isNil(options.report) && !options.report) {
		error.report = false;
	}

	if (!_.isNil(options.code)) {
		error.code = options.code;
	}

	return error;
}

/**
 * @summary Create a user error
 *
 * @description
 * User errors represent invalid states that the user
 * caused, that are not errors on the application itself.
 * Therefore, user errors don't get reported to analytics
 * and error reporting services.
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
 */
export function isUserError(error: Error & { report?: boolean }): boolean {
	return _.isNil(error.report) ? false : !error.report;
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
		errno?: number;
		stdout?: string;
		stderr?: string;
		device?: string;
	},
): any {
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
 */
export function fromJSON(json: any): Error {
	return _.assign(new Error(json.message), json);
}
