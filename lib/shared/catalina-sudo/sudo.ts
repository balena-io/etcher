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

import { execFile } from 'child_process';
import { join } from 'path';
import { env } from 'process';
import { promisify } from 'util';

import { getAppPath } from '../utils';

const execFileAsync = promisify(execFile);

const SUCCESSFUL_AUTH_MARKER = 'AUTHENTICATION SUCCEEDED';
const EXPECTED_SUCCESSFUL_AUTH_MARKER = `${SUCCESSFUL_AUTH_MARKER}\n`;

export async function sudo(
	command: string,
): Promise<{ cancelled: boolean; stdout?: string; stderr?: string }> {
	try {
		const { stdout, stderr } = await execFileAsync(
			'sudo',
			['--askpass', 'sh', '-c', `echo ${SUCCESSFUL_AUTH_MARKER} && ${command}`],
			{
				encoding: 'utf8',
				env: {
					PATH: env.PATH,
					SUDO_ASKPASS: join(
						getAppPath(),
						__dirname,
						'sudo-askpass.osascript.js',
					),
				},
			},
		);
		return {
			cancelled: false,
			stdout: stdout.slice(EXPECTED_SUCCESSFUL_AUTH_MARKER.length),
			stderr,
		};
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
