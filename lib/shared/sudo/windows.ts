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
// import { env } from 'process';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { join, sep } from 'path';
import { mkdir, writeFile, copyFile, readFile } from 'fs/promises';

/**
 * TODO:
 * Migrate, modernize and clenup the windows elevation code from the old @balena/sudo-prompt package in a similar way to linux-sudo.ts and catalina-sudo files.
 */

export async function sudo(
	command: string,
	name: string,
	env: any,
): Promise<{ cancelled: boolean; stdout?: string; stderr?: string }> {
	// console.log('name', name);

	const uuid = uuidv4();

	const temp = tmpdir();
	if (!temp) {
		throw new Error('os.tmpdir() not defined.');
	}

	const tmpFolder = join(temp, uuid);

	if (/"/.test(tmpFolder)) {
		// We expect double quotes to be reserved on Windows.
		// Even so, we test for this and abort if they are present.
		throw new Error('instance.path cannot contain double-quotes.');
	}

	const executeScriptPath = join(tmpFolder, 'execute.bat');
	const commandScriptPath = join(tmpFolder, 'command.bat');
	const stdoutPath = join(tmpFolder, 'stdout');
	const stderrPath = join(tmpFolder, 'stderr');
	const statusPath = join(tmpFolder, 'status');

	const SUCCESSFUL_AUTH_MARKER = 'AUTHENTICATION SUCCEEDED';

	try {
		await mkdir(tmpFolder);

		// WindowsWriteExecuteScript(instance, end)
		const executeScript = `
      @echo off\r\n
      call "${commandScriptPath}" > "${stdoutPath}" 2> "${stderrPath}"\r\n
      (echo %ERRORLEVEL%) > "${statusPath}"
    `;

		await writeFile(executeScriptPath, executeScript, 'utf-8');

		// WindowsWriteCommandScript(instance, end)
		const cwd = process.cwd();
		if (/"/.test(cwd)) {
			// We expect double quotes to be reserved on Windows.
			// Even so, we test for this and abort if they are present.
			throw new Error('process.cwd() cannot contain double-quotes.');
		}

		const commandScriptArray = [];
		commandScriptArray.push('@echo off');
		// Set code page to UTF-8:
		commandScriptArray.push('chcp 65001>nul');
		// Preserve current working directory:
		// We pass /d as an option in case the cwd is on another drive (issue 70).
		commandScriptArray.push(`cd /d "${cwd}"`);
		// Export environment variables:
		for (const key in env) {
			// "The characters <, >, |, &, ^ are special command shell characters, and
			// they must be preceded by the escape character (^) or enclosed in
			// quotation marks. If you use quotation marks to enclose a string that
			// contains one of the special characters, the quotation marks are set as
			// part of the environment variable value."
			// In other words, Windows assigns everything that follows the equals sign
			// to the value of the variable, whereas Unix systems ignore double quotes.
			if (Object.prototype.hasOwnProperty.call(env, key)) {
				const value = env[key];
				commandScriptArray.push(
					`set ${key}=${value!.replace(/([<>\\|&^])/g, '^$1')}`,
				);
			}
		}
		commandScriptArray.push(`echo ${SUCCESSFUL_AUTH_MARKER}`);
		commandScriptArray.push(command);
		await writeFile(
			commandScriptPath,
			commandScriptArray.join('\r\n'),
			'utf-8',
		);

		// WindowsCopyCmd(instance, end)
		if (windowsNeedsCopyCmd(tmpFolder)) {
			// Work around https://github.com/jorangreef/sudo-prompt/issues/97
			// Powershell can't properly escape amperstands in paths.
			// We work around this by copying cmd.exe in our temporary folder and running
			// it from here (see WindowsElevate below).
			// That way, we don't have to pass the path containing the amperstand at all.
			// A symlink would probably work too but you have to be an administrator in
			// order to create symlinks on Windows.
			await copyFile(
				join(process.env.SystemRoot!, 'System32', 'cmd.exe'),
				join(tmpFolder, 'cmd.exe'),
			);
		}

		// WindowsElevate(instance, end)
		// We used to use this for executing elevate.vbs:
		// var command = 'cscript.exe //NoLogo "' + instance.pathElevate + '"';
		const spawnCommand = [];
		// spawnCommand.push("powershell.exe") // as we use spawn this one is out of the array
		spawnCommand.push('Start-Process');
		spawnCommand.push('-FilePath');
		const options: any = { encoding: 'utf8' };
		if (windowsNeedsCopyCmd(tmpFolder)) {
			// Node.path.join('.', 'cmd.exe') would return 'cmd.exe'
			spawnCommand.push(['.', 'cmd.exe'].join(sep));
			spawnCommand.push('-ArgumentList');
			spawnCommand.push('"/C","execute.bat"');
			options.cwd = tmpFolder;
		} else {
			// Escape characters for cmd using double quotes:
			// Escape characters for PowerShell using single quotes:
			// Escape single quotes for PowerShell using backtick:
			// See: https://ss64.com/ps/syntax-esc.html
			spawnCommand.push(`'${executeScriptPath.replace(/'/g, "`'")}'`);
		}
		spawnCommand.push('-WindowStyle hidden');
		spawnCommand.push('-Verb runAs');

		spawn('powershell.exe', spawnCommand);

		// setTimeout(() => {elevated = "granted"}, 5000)

		// we don't spawn or read stdout in the promise otherwise resolving stop the process
		return new Promise((resolve, reject) => {
			const checkElevation = setInterval(async () => {
				try {
					const result = await readFile(stdoutPath, 'utf-8');
					const error = await readFile(stderrPath, 'utf-8');

					if (error && error !== '') {
						throw new Error(error);
					}

					// TODO: should track something more generic
					if (result.includes(SUCCESSFUL_AUTH_MARKER)) {
						clearInterval(checkElevation);
						resolve({ cancelled: false });
					}
				} catch (error) {
					console.log(
						'Error while reading flasher elevation script output',
						error,
					);
				}
			}, 1000);

			// if the elevation didn't occured in 30 seconds we reject the promise
			setTimeout(() => {
				clearInterval(checkElevation);
				reject(new Error('Elevation timeout'));
			}, 30000);
		});

		// WindowsWaitForStatus(instance, end)

		// WindowsResult(instance, end)
	} catch (error) {
		throw new Error(`Can't elevate process ${error}`);
	} finally {
		// TODO: cleanup
		//   // Remove(instance.path, function (errorRemove) {
		//   // if (error) return callback(error)
		//   // if (errorRemove) return callback(errorRemove)
		//   // callback(undefined, stdout, stderr)
	}
}

function windowsNeedsCopyCmd(path: string) {
	const specialChars = ['&', '`', "'", '"', '<', '>', '|', '^'];
	for (const specialChar of specialChars) {
		if (path.includes(specialChar)) {
			return true;
		}
	}
	return false;
}
