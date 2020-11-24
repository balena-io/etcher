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

import { exec } from 'child_process';
import { readFile } from 'fs';
import { chain, trim } from 'lodash';
import { platform } from 'os';
import { join } from 'path';
import { env } from 'process';
import { promisify } from 'util';

import { withTmpFile } from '../../../shared/tmp';

const readFileAsync = promisify(readFile);

const execAsync = promisify(exec);

/**
 * @summary Returns wmic's output for network drives
 */
async function getWmicNetworkDrivesOutput(): Promise<string> {
	// When trying to read wmic's stdout directly from node, it is encoded with the current
	// console codepage (depending on the computer).
	// Decoding this would require getting this codepage somehow and using iconv as node
	// doesn't know how to read cp850 directly for example.
	// We could also use wmic's "/output:" switch but it doesn't work when the filename
	// contains a space and the os temp dir may contain spaces ("D:\Windows Temp Files" for example).
	// So we just redirect to a file and read it afterwards as we know it will be ucs2 encoded.
	const options = {
		// Close the file once it's created
		discardDescriptor: true,
		// Wmic fails with "Invalid global switch" when the "/output:" switch filename contains a dash ("-")
		prefix: 'tmp',
	};
	return withTmpFile(options, async (path) => {
		const command = [
			join(env.SystemRoot as string, 'System32', 'Wbem', 'wmic'),
			'path',
			'Win32_LogicalDisk',
			'Where',
			'DriveType="4"',
			'get',
			'DeviceID,ProviderName',
			'>',
			`"${path}"`,
		];
		await execAsync(command.join(' '), { windowsHide: true });
		return readFileAsync(path, 'ucs2');
	});
}

/**
 * @summary returns a Map of drive letter -> network locations on Windows: 'Z:' -> '\\\\192.168.0.1\\Public'
 */
async function getWindowsNetworkDrives(
	getWmicOutput: () => Promise<string>,
): Promise<Map<string, string>> {
	const result = await getWmicOutput();
	const couples: Array<[string, string]> = chain(result)
		.split('\n')
		// Remove header line
		.slice(1)
		// Remove extra spaces / tabs / carriage returns
		.invokeMap(String.prototype.trim)
		// Filter out empty lines
		.compact()
		.map((str: string): [string, string] => {
			const colonPosition = str.indexOf(':');
			if (colonPosition === -1) {
				throw new Error(`Can't parse wmic output: ${result}`);
			}
			return [
				str.slice(0, colonPosition + 1),
				trim(str.slice(colonPosition + 1)),
			];
		})
		.filter((couple) => couple[1].length > 0)
		.value();
	return new Map(couples);
}

/**
 * @summary Replaces network drive letter with network drive location in the provided filePath on Windows
 */
export async function replaceWindowsNetworkDriveLetter(
	filePath: string,
	// getWmicOutput is a parameter so it can be replaced in tests
	getWmicOutput = getWmicNetworkDrivesOutput,
): Promise<string> {
	let result = filePath;
	if (platform() === 'win32') {
		const matches = /^([A-Z]+:)\\(.*)$/.exec(filePath);
		if (matches !== null) {
			const [, drive, relativePath] = matches;
			const drives = await getWindowsNetworkDrives(getWmicOutput);
			const location = drives.get(drive);
			if (location !== undefined) {
				result = `${location}\\${relativePath}`;
			}
		}
	}
	return result;
}
