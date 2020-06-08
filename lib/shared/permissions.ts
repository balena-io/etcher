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
import * as childProcess from 'child_process';
import { promises as fs } from 'fs';
import * as _ from 'lodash';
import * as os from 'os';
import * as semver from 'semver';
import * as sudoPrompt from 'sudo-prompt';
import { promisify } from 'util';

import { sudo as catalinaSudo } from './catalina-sudo/sudo';
import * as errors from './errors';
import { tmpFileDisposer } from './utils';

const execAsync = promisify(childProcess.exec);
const execFileAsync = promisify(childProcess.execFile);
// sudo-prompt's exec callback is function(error, stdout, stderr) so we need multiArgs
const sudoExecAsync = Bluebird.promisify(sudoPrompt.exec, {
	multiArgs: true,
}) as (cmd: string, options: any) => Bluebird<[string, string]>;

/**
 * @summary The user id of the UNIX "superuser"
 */
const UNIX_SUPERUSER_USER_ID = 0;

export async function isElevated(): Promise<boolean> {
	if (os.platform() === 'win32') {
		// `fltmc` is available on WinPE, XP, Vista, 7, 8, and 10
		// Works even when the "Server" service is disabled
		// See http://stackoverflow.com/a/28268802
		try {
			await execAsync('fltmc');
		} catch (error) {
			if (error.code === os.constants.errno.EPERM) {
				return false;
			}
			throw error;
		}
		return true;
	}
	return process.geteuid() === UNIX_SUPERUSER_USER_ID;
}

/**
 * @summary Check if the current process is running with elevated permissions
 */
export function isElevatedUnixSync(): boolean {
	return process.geteuid() === UNIX_SUPERUSER_USER_ID;
}

function escapeSh(value: any): string {
	// Make sure it's a string
	// Replace ' -> '\'' (closing quote, escaped quote, opening quote)
	// Surround with quotes
	return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function escapeParamCmd(value: any): string {
	// Make sure it's a string
	// Escape " -> \"
	// Surround with double quotes
	return `"${String(value).replace(/"/g, '\\"')}"`;
}

function setEnvVarSh(value: any, name: string): string {
	return `export ${name}=${escapeSh(value)}`;
}

function setEnvVarCmd(value: any, name: string): string {
	return `set "${name}=${String(value)}"`;
}

// Exported for tests
export function createLaunchScript(
	command: string,
	argv: string[],
	environment: _.Dictionary<string | undefined>,
): string {
	const isWindows = os.platform() === 'win32';
	const lines = [];
	if (isWindows) {
		// Switch to utf8
		lines.push('chcp 65001');
	}
	const [setEnvVarFn, escapeFn] = isWindows
		? [setEnvVarCmd, escapeParamCmd]
		: [setEnvVarSh, escapeSh];
	lines.push(..._.map(environment, setEnvVarFn));
	lines.push([command, ...argv].map(escapeFn).join(' '));
	return lines.join(os.EOL);
}

async function elevateScriptWindows(
	path: string,
): Promise<{ cancelled: boolean }> {
	// 'elevator' imported here as it only exists on windows
	// TODO: replace this with sudo-prompt once https://github.com/jorangreef/sudo-prompt/issues/96 is fixed
	// @ts-ignore this is a native module
	const { elevate } = await import('../../build/Release/elevator.node');
	const elevateAsync = promisify(elevate);

	// '&' needs to be escaped here (but not when written to a .cmd file)
	const cmd = ['cmd', '/c', escapeParamCmd(path).replace(/&/g, '^&')];
	const { cancelled } = await elevateAsync(cmd);
	return { cancelled };
}

async function elevateScriptUnix(
	path: string,
	name: string,
): Promise<{ cancelled: boolean }> {
	const cmd = ['bash', escapeSh(path)].join(' ');
	await sudoExecAsync(cmd, { name });
	return { cancelled: false };
}

async function elevateScriptCatalina(
	path: string,
): Promise<{ cancelled: boolean }> {
	const cmd = ['bash', escapeSh(path)].join(' ');
	try {
		const { cancelled } = await catalinaSudo(cmd);
		return { cancelled };
	} catch (error) {
		throw errors.createError({ title: error.stderr });
	}
}

export async function elevateCommand(
	command: string[],
	options: {
		environment: _.Dictionary<string | undefined>;
		applicationName: string;
	},
): Promise<{ cancelled: boolean }> {
	if (await isElevated()) {
		await execFileAsync(command[0], command.slice(1), {
			env: options.environment,
		});
		return { cancelled: false };
	}
	const isWindows = os.platform() === 'win32';
	const launchScript = createLaunchScript(
		command[0],
		command.slice(1),
		options.environment,
	);
	return Bluebird.using(
		tmpFileDisposer({
			prefix: 'balena-etcher-electron-',
			postfix: '.cmd',
		}),
		async ({ path }) => {
			await fs.writeFile(path, launchScript);
			if (isWindows) {
				return elevateScriptWindows(path);
			}
			if (
				os.platform() === 'darwin' &&
				semver.compare(os.release(), '19.0.0') >= 0
			) {
				// >= macOS Catalina
				return elevateScriptCatalina(path);
			}
			try {
				return await elevateScriptUnix(path, options.applicationName);
			} catch (error) {
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
		},
	);
}
