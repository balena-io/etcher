/* 
 * This is heavily inspired (read: a ripof) https://github.com/balena-io-modules/sudo-prompt
 * Which was a fork of https://github.com/jorangreef/sudo-prompt
 * 
 * This and the original code was released under The MIT License (MIT)
 * 
 * Copyright (c) 2015 Joran Dirk Greef
 * Copyright (c) 2024 Balena
 * 
    The MIT License (MIT)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
 */

import { spawn } from 'child_process';
import { access, constants } from 'fs/promises';
import { env } from 'process';

// const execFileAsync = promisify(execFile);

const SUCCESSFUL_AUTH_MARKER = 'AUTHENTICATION SUCCEEDED';

/** Check for kdesudo or pkexec */
function checkLinuxBinary() {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve, reject) => {
		// We used to prefer gksudo over pkexec since it enabled a better prompt.
		// However, gksudo cannot run multiple commands concurrently.

		const paths = ['/usr/bin/kdesudo', '/usr/bin/pkexec'];
		for (const path of paths) {
			try {
				// check if the file exist and is executable
				await access(path, constants.X_OK);
				resolve(path);
			} catch (error: any) {
				continue;
			}
		}
		reject('Unable to find pkexec or kdesudo.');
	});
}

function escapeDoubleQuotes(escapeString: string) {
	return escapeString.replace(/"/g, '\\"');
}

export async function sudo(
	command: string,
	{ name }: { name: string },
): Promise<{ cancelled: boolean; stdout?: string; stderr?: string }> {
	const linuxBinary: string = (await checkLinuxBinary()) as string;
	if (!linuxBinary) {
		throw new Error('Unable to find pkexec or kdesudo.');
	}

	const parameters = [];

	if (/kdesudo/i.test(linuxBinary)) {
		parameters.push(
			'--comment',
			`"${name} wants to make changes.
			Enter your password to allow this."`,
		);
		parameters.push('-d'); // Do not show the command to be run in the dialog.
		parameters.push('--');
	} else if (/pkexec/i.test(linuxBinary)) {
		parameters.push('--disable-internal-agent');
	}

	parameters.push('/bin/bash');
	parameters.push('-c');
	parameters.push(
		`echo ${SUCCESSFUL_AUTH_MARKER} && ${escapeDoubleQuotes(command)}`,
	);

	const elevateProcess = spawn(linuxBinary, parameters, {
		// encoding: "utf8",
		env: {
			PATH: env.PATH,
		},
	});

	let elevated = '';

	elevateProcess.stdout.on('data', (data) => {
		// console.log(`stdout: ${data.toString()}`);
		if (data.toString().includes(SUCCESSFUL_AUTH_MARKER)) {
			// if the first data comming out of the sudo command is the expected marker we resolve the promise
			elevated = 'granted';
		} else {
			// if the first data comming out of the sudo command is not the expected marker we reject the promise
			elevated = 'refused';
		}
	});

	// elevateProcess.stderr.on('data', (data) => {
	// 	// console.log(`stderr: ${data.toString()}`);
	// 	// if (data.toString().includes(SUCCESSFUL_AUTH_MARKER)) {
	// 	// 	// if the first data comming out of the sudo command is the expected marker we resolve the promise
	// 	// 	elevated = 'granted';
	// 	// } else {
	// 	// 	// if the first data comming out of the sudo command is not the expected marker we reject the promise
	// 	// 	elevated = 'refused';
	// 	// }
	// });

	// we don't spawn or read stdout in the promise otherwise resolving stop the process
	return new Promise((resolve, reject) => {
		const checkElevation = setInterval(() => {
			if (elevated === 'granted') {
				clearInterval(checkElevation);
				resolve({ cancelled: false });
			} else if (elevated === 'refused') {
				clearInterval(checkElevation);
				resolve({ cancelled: true });
			}
		}, 300);

		// if the elevation didn't occured in 30 seconds we reject the promise
		setTimeout(() => {
			clearInterval(checkElevation);
			reject(new Error('Elevation timeout'));
		}, 30000);
	});
}
