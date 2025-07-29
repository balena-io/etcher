/*
 * Copyright 2025 balena.io
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

import { spawn } from 'child_process';

export async function sudo(
	command: string[],
): Promise<{ cancelled: boolean; stdout?: string; stderr?: string }> {
	try {
		// Powershell (required to ask for elevated privileges) as of win10
		// cannot pass environment variables as a map, so we pass them as args
		// this is a workaround as we can't use an equivalent of `sudo -E` on Windows

		const spawnCommand = [];
		spawnCommand.push('Start-Process');
		spawnCommand.push('-FilePath');

		// Escape characters for cmd using double quotes:
		// Escape characters for PowerShell using single quotes:
		// Escape single quotes for PowerShell using backtick:
		// See: https://ss64.com/ps/syntax-esc.html
		spawnCommand.push(`'${command[0].replace(/'/g, "`'")}'`);

		spawnCommand.push('-ArgumentList');

		// Join and escape arguments for PowerShell
		spawnCommand.push(
			`'${command
				.slice(1)
				.map((a) => a.replace(/'/g, "`'"))
				.join(' ')}'`,
		);
		spawnCommand.push('-WindowStyle hidden');
		spawnCommand.push('-Verb runAs');

		const child = spawn('powershell.exe', spawnCommand);

		let result = { status: 'waiting' };

		child.on('close', (code) => {
			if (code === 0) {
				// User accepted UAC, process started
				console.log('UAC accepted, process started');
				result = { status: 'granted' };
			} else {
				// User cancelled or error occurred
				console.log('UAC cancelled or error occurred');
				result = { status: 'cancelled' };
			}
		});

		child.on('error', (err) => {
			result = { status: err.message };
		});

		// we don't spawn directly in the promise otherwise resolving stop the process

		return new Promise((resolve, reject) => {
			const checkElevation = setInterval(() => {
				if (result.status === 'waiting') {
					return;
				} else if (result.status === 'granted') {
					clearInterval(checkElevation);
					resolve({ cancelled: false });
				} else if (result.status === 'cancelled') {
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
	} catch (error) {
		throw new Error(`Can't elevate process ${error}`);
	}
}
