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

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as _ from 'lodash';
import * as os from 'os';
import * as semver from 'semver';

import { sudo as darwinSudo } from './sudo/darwin';
import { sudo as linuxSudo } from './sudo/linux';
import { sudo as winSudo } from './sudo/windows';
import * as errors from './errors';

const execAsync = promisify(exec);

/**
 * @summary The user id of the UNIX "superuser"
 */
const UNIX_SUPERUSER_USER_ID = 0;

// Augment the command to pass the environment variables as args
// This is required because both windows and linux sudo commands strips the environment
// variables when running the elevated command, so we need to pass them as arguments
function commandWithEnv(
	command: string[],
	env: _.Dictionary<string | undefined>,
): string[] {
	const envFilter: string[] = [
		'ETCHER_SERVER_ADDRESS',
		'ETCHER_SERVER_PORT',
		'ETCHER_SERVER_ID',
		'ETCHER_NO_SPAWN_UTIL',
		'ETCHER_TERMINATE_TIMEOUT',
		'UV_THREADPOOL_SIZE',
	];

	return [
		command[0],
		...command.slice(1),
		...Object.keys(env)
			.filter((key) => Object.prototype.hasOwnProperty.call(env, key))
			.filter((key) => envFilter.includes(key))
			.map((key) => `--${key}=${env[key]}`),
	];
}

export async function isElevated(): Promise<boolean> {
	if (os.platform() === 'win32') {
		// `fltmc` is available on WinPE, XP, Vista, 7, 8, and 10
		// Works even when the "Server" service is disabled
		// See http://stackoverflow.com/a/28268802
		try {
			await execAsync('fltmc');
		} catch (error: any) {
			if (error.code === os.constants.errno.EPERM) {
				return false;
			}
			throw error;
		}
		return true;
	}
	return process.geteuid!() === UNIX_SUPERUSER_USER_ID;
}

/**
 * @summary Check if the current process is running with elevated permissions
 */
export function isElevatedUnixSync(): boolean {
	return process.geteuid!() === UNIX_SUPERUSER_USER_ID;
}

export async function elevateCommand(
	command: string[],
	options: {
		env: _.Dictionary<string | undefined>;
		applicationName: string;
	},
): Promise<{ cancelled: boolean }> {
	// if we're running with elevated privileges, we can just spawn the command
	if (await isElevated()) {
		spawn(command[0], command.slice(1), {
			env: options.env,
		});
		return { cancelled: false };
	}

	try {
		if (os.platform() === 'win32') {
			const { cancelled } = await winSudo(commandWithEnv(command, options.env));
			return { cancelled };
		}
		if (
			os.platform() === 'darwin' &&
			semver.compare(os.release(), '19.0.0') >= 0
		) {
			// >= macOS Catalina
			const { cancelled } = await darwinSudo(command, options.env);
			return { cancelled };
		}
	} catch (error: any) {
		throw errors.createError({ title: error.stderr });
	}

	try {
		const { cancelled } = await linuxSudo(commandWithEnv(command, options.env));
		return { cancelled };
	} catch (error: any) {
		// We're hardcoding internal error messages declared by `sudo-prompt`.
		// There doesn't seem to be a better way to handle these errors, so
		// for now, we should make sure we double check if the error messages
		// have changed every time we upgrade `sudo-prompt`.
		console.log('error', error);
		if (_.includes(error.message, 'is not in the sudoers file')) {
			throw errors.createUserError({
				title: "Your user doesn't have enough privileges to proceed",
				description:
					'This application requires sudo privileges to be able to write to drives',
			});
		} else if (_.startsWith(error.message, 'Command failed:')) {
			throw errors.createUserError({
				title: 'The elevated process died unexpectedly',
				description: `The process error code was ${error.code}`,
			});
		} else if (error.message === 'User did not grant permission.') {
			return { cancelled: true };
		} else if (error.message === 'No polkit authentication agent found.') {
			throw errors.createUserError({
				title: 'No polkit authentication agent found',
				description:
					'Please install a polkit authentication agent for your desktop environment of choice to continue',
			});
		}
		throw error;
	}
}
