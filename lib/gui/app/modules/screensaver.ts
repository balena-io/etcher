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

import * as settings from '../models/settings';

const execFileAsync = promisify(execFile);
const EVENT_TYPES = [
	'focus',
	'keydown',
	'keyup',
	'pointerdown',
	'pointermove',
	'pointerup',
] as const;

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

export async function off() {
	await Promise.all([ledsOff(), screenOff()]);
}

let timeout: NodeJS.Timeout;
let delay: number | null = null;

async function listener() {
	if (timeout !== undefined) {
		clearTimeout(timeout);
	}
	if (delay !== null) {
		timeout = setTimeout(off, delay);
	}
	await ledsOn();
}

async function setDelay($delay: number | null) {
	const listenersSetUp = delay === null;
	delay = $delay;
	if (timeout !== undefined) {
		clearTimeout(timeout);
	}
	if (delay === null) {
		for (const eventType of EVENT_TYPES) {
			removeEventListener(eventType, listener);
		}
	} else {
		timeout = setTimeout(screenOff, delay);
		if (!listenersSetUp) {
			for (const eventType of EVENT_TYPES) {
				addEventListener(eventType, listener);
			}
		}
	}
}

function delayValue(d?: string): number | null {
	if (d === undefined || d === 'never') {
		return null;
	}
	return parseInt(d, 10) * 60 * 1000;
}

export async function init(): Promise<void> {
	setDelay(delayValue(await settings.get('screensaverDelay')));
	settings.events.on('screensaverDelay', d => {
		setDelay(delayValue(d));
	});
}
