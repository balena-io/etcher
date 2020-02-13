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

import {
	AnimationFunction,
	blinkWhite,
	breatheGreen,
	Color,
	RGBLed,
} from 'sys-class-rgb-led';

import * as settings from './settings';
import { observe } from './store';

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
	// 		'led1_r',
	// 		'led1_g',
	// 		'led1_b',
	// 	],
	// 	...
	// }
	const ledsMapping: _.Dictionary<[string, string, string]> =
		settings.get('ledsMapping') || {};
	for (const [drivePath, ledsNames] of Object.entries(ledsMapping)) {
		leds.set('/dev/disk/by-path/' + drivePath, new RGBLed(ledsNames));
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
