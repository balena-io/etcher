/*
 * Copyright 2019 resin.io
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
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const EVENT_TYPES = [
	'focus',
	'keydown',
	'keyup',
	'pointerdown',
	'pointermove',
	'pointerup',
] as const;
const SCREENSAVER_DELAY = 30 * 1000; // TODO: make this configurable

function exec(
	command: string,
	...args: string[]
): Promise<{ stdout: string; stderr: string }> {
	return execFileAsync(command, args);
}

async function screenOff(): Promise<void> {
	await exec('xset', 'dpms', 'force', 'suspend');
}

async function ledsOn(): Promise<void> {
	// TODO
}

async function ledsOff(): Promise<void> {
	// TODO
}

async function off() {
	await Promise.all([ledsOff(), screenOff()]);
}

export function init(): void {
	let timeout = setTimeout(screenOff, SCREENSAVER_DELAY);
	for (const eventType of EVENT_TYPES) {
		addEventListener(eventType, async () => {
			clearTimeout(timeout);
			timeout = setTimeout(off, SCREENSAVER_DELAY);
			await ledsOn();
		});
	}
}
