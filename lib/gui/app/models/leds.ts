/*
 * Copyright 2020 balena.io
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

import { delay } from 'bluebird';
import { promises as fs } from 'fs';

import * as settings from './settings';
import { observe } from './store';

class Led {
	private handle: fs.FileHandle;
	private lastValue?: number;

	constructor(private path: string) {}

	private async open() {
		if (this.handle === undefined) {
			this.handle = await fs.open(this.path, 'w');
		}
	}

	public async setIntensity(intensity: number) {
		if (intensity < 0 || intensity > 1) {
			throw new Error('Led intensity must be between 0 and 1');
		}
		const value = Math.round(intensity * 255);
		if (value !== this.lastValue) {
			await this.open();
			await this.handle.write(value.toString(), 0);
			// On a regular file we would also need to truncate to the written value length but it looks like it's not the case on sysfs files
			this.lastValue = value;
		}
	}
}

export type Color = [number, number, number];
export type AnimationFunction = (t: number) => Color;

function delay1(duration: number): Promise<void> {
	// delay that accepts Infinity
	if (duration === Infinity) {
		return new Promise(() => {
			// Never resolve
		});
	} else {
		return delay(duration);
	}
}

function cancellableDelay(
	duration: number,
): { promise: Promise<void>; cancel: () => void } {
	let maybeCancel: () => void;
	const cancel = () => {
		if (maybeCancel !== undefined) {
			maybeCancel();
		}
	};
	const cancelPromise: Promise<void> = new Promise(resolve => {
		maybeCancel = resolve;
	});
	const promise = Promise.race([delay1(duration), cancelPromise]);
	return { promise, cancel };
}

export class RGBLed {
	private leds: [Led, Led, Led];
	private animation: AnimationFunction;
	private period: number; // in ms
	private wakeUp = () => {
		// noop until this.loop() is called
	};

	constructor(paths: [string, string, string]) {
		this.leds = paths.map(path => new Led(path)) as [Led, Led, Led];
		this.setStaticColor([0, 0, 0]);
		this.loop();
	}

	private setFrequency(frequency: number) {
		if (frequency < 0) {
			throw new Error('frequency must be greater or equal to 0');
		}
		this.period = 1000 / frequency;
		this.wakeUp();
	}

	private async loop() {
		while (true) {
			const start = new Date().getTime();
			await this.setColor(this.animation(start));
			const end = new Date().getTime();
			const duration = end - start;
			const { promise, cancel } = cancellableDelay(this.period - duration);
			this.wakeUp = cancel;
			await promise;
		}
	}

	public setAnimation(animation: AnimationFunction, frequency = 10) {
		this.animation = animation;
		this.setFrequency(frequency);
	}

	public setStaticColor(color: Color) {
		this.setAnimation(() => color, 0);
	}

	private async setColor(color: Color) {
		await Promise.all([
			this.leds[0].setIntensity(color[0]),
			this.leds[1].setIntensity(color[1]),
			this.leds[2].setIntensity(color[2]),
		]);
	}
}

// Animations:
function breatheGreen(t: number): Color {
	const intensity = (1 + Math.sin(t / 1000)) / 2;
	return [0, intensity, 0];
}

function blinkWhite(t: number): Color {
	const intensity = Math.floor(t / 1000) % 2;
	return [intensity, intensity, intensity];
}

const leds: Map<string, RGBLed> = new Map();

function setLeds(
	drivesPaths: Set<string>,
	colorOrAnimation: Color | AnimationFunction,
) {
	for (const path of drivesPaths) {
		const led = leds.get(path);
		if (led) {
			if (Array.isArray(colorOrAnimation)) {
				led.setStaticColor(colorOrAnimation);
			} else {
				led.setAnimation(colorOrAnimation);
			}
		}
	}
}

export function updateLeds(
	availableDrives: string[],
	selectedDrives: string[],
) {
	const off = new Set(leds.keys());
	const available = new Set(availableDrives);
	const selected = new Set(selectedDrives);
	for (const s of selected) {
		available.delete(s);
	}
	for (const a of available) {
		off.delete(a);
	}
	setLeds(off, [0, 0, 0]);
	setLeds(available, breatheGreen);
	setLeds(selected, blinkWhite);
}

interface DeviceFromState {
	devicePath?: string;
	device: string;
}

export function init() {
	// ledsMapping is something like:
	// {
	// 	'platform-xhci-hcd.0.auto-usb-0:1.1.1:1.0-scsi-0:0:0:0': [
	// 		'/sys/class/leds/led1_r',
	// 		'/sys/class/leds/led1_g',
	// 		'/sys/class/leds/led1_b',
	// 	],
	// 	...
	// }
	const ledsMapping: _.Dictionary<[string, string, string]> =
		settings.get('ledsMapping') || {};
	for (const [drivePath, ledsPaths] of Object.entries(ledsMapping)) {
		leds.set('/dev/disk/by-path/' + drivePath, new RGBLed(ledsPaths));
	}
	observe(state => {
		const availableDrives = state
			.get('availableDrives')
			.toJS()
			.filter((d: DeviceFromState) => d.devicePath);
		const availableDrivesPaths = availableDrives.map(
			(d: DeviceFromState) => d.devicePath,
		);
		// like /dev/sda
		const selectedDrivesDevices = state.getIn(['selection', 'devices']).toJS();
		const selectedDrivesPaths = availableDrives
			.filter((d: DeviceFromState) => selectedDrivesDevices.includes(d.device))
			.map((d: DeviceFromState) => d.devicePath);
		updateLeds(availableDrivesPaths, selectedDrivesPaths);
	});
}
