/*
 * Copyright 2019 balena.io
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
import { join } from 'path';
import { env } from 'process';
// import { promisify } from "util";

import { supportedLocales } from '../../gui/app/i18n';

// const execFileAsync = promisify(execFile);

const SUCCESSFUL_AUTH_MARKER = 'AUTHENTICATION SUCCEEDED';
const EXPECTED_SUCCESSFUL_AUTH_MARKER = `${SUCCESSFUL_AUTH_MARKER}\n`;

function getAskPassScriptPath(lang: string): string {
	if (process.env.NODE_ENV === 'development') {
		// Force webpack's hand to bundle the script.
		return require.resolve(`./sudo-askpass.osascript-${lang}.js`);
	}
	// Otherwise resolve the script relative to resources path.
	return join(process.resourcesPath, `sudo-askpass.osascript-${lang}.js`);
}

export async function sudo(
	command: string,
): Promise<{ cancelled: boolean; stdout?: string; stderr?: string }> {
	try {
		let lang = Intl.DateTimeFormat().resolvedOptions().locale;
		lang = lang.substr(0, 2);
		if (supportedLocales.indexOf(lang) > -1) {
			// language should be present
		} else {
			// fallback to eng
			lang = 'en';
		}

		const elevateProcess = spawn(
			'sudo',
			['--askpass', 'sh', '-c', `echo ${SUCCESSFUL_AUTH_MARKER} && ${command}`],
			{
				// encoding: "utf8",
				env: {
					PATH: env.PATH,
					SUDO_ASKPASS: getAskPassScriptPath(lang),
				},
			},
		);

		let elevated = 'pending';

		elevateProcess.stdout.on('data', (data) => {
			if (data.toString().includes(SUCCESSFUL_AUTH_MARKER)) {
				// if the first data comming out of the sudo command is the expected marker we resolve the promise
				elevated = 'granted';
			} else {
				// if the first data comming out of the sudo command is not the expected marker we reject the promise
				elevated = 'rejected';
			}
		});

		// we don't spawn or read stdout in the promise otherwise resolving stop the process
		return new Promise((resolve, reject) => {
			const checkElevation = setInterval(() => {
				if (elevated === 'granted') {
					clearInterval(checkElevation);
					resolve({ cancelled: false });
				} else if (elevated === 'rejected') {
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
	} catch (error: any) {
		if (error.code === 1) {
			if (!error.stdout.startsWith(EXPECTED_SUCCESSFUL_AUTH_MARKER)) {
				return { cancelled: true };
			}
			error.stdout = error.stdout.slice(EXPECTED_SUCCESSFUL_AUTH_MARKER.length);
		}
		throw error;
	}
}
