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

import * as _ from 'lodash';
import { AnimationFunction, Color, RGBLed } from 'sys-class-rgb-led';

import {
	isSourceDrive,
	DrivelistDrive,
} from '../../../shared/drive-constraints';
import * as settings from './settings';
import { DEFAULT_STATE, observe } from './store';

const leds: Map<string, RGBLed> = new Map();

function setLeds(
	drivesPaths: Set<string>,
	colorOrAnimation: Color | AnimationFunction,
	frequency?: number,
) {
	for (const path of drivesPaths) {
		const led = leds.get(path);
		if (led) {
			if (Array.isArray(colorOrAnimation)) {
				led.setStaticColor(colorOrAnimation);
			} else {
				led.setAnimation(colorOrAnimation, frequency);
			}
		}
	}
}

const red: Color = [1, 0, 0];
const green: Color = [0, 1, 0];
const blue: Color = [0, 0, 1];
const white: Color = [1, 1, 1];
const black: Color = [0, 0, 0];
const purple: Color = [0.5, 0, 0.5];

function createAnimationFunction(
	intensityFunction: (t: number) => number,
	color: Color,
): AnimationFunction {
	return (t: number): Color => {
		const intensity = intensityFunction(t);
		return color.map((v) => v * intensity) as Color;
	};
}

function blink(t: number) {
	return Math.floor(t / 1000) % 2;
}

function breathe(t: number) {
	return (1 + Math.sin(t / 1000)) / 2;
}

const breatheBlue = createAnimationFunction(breathe, blue);
const blinkGreen = createAnimationFunction(blink, green);
const blinkPurple = createAnimationFunction(blink, purple);

interface LedsState {
	step: 'main' | 'flashing' | 'verifying' | 'finish';
	sourceDrive: string | undefined;
	availableDrives: string[];
	selectedDrives: string[];
	failedDrives: string[];
}

// Source slot (1st slot): behaves as a target unless it is chosen as source
//  No drive: black
//  Drive plugged: blue - on
//
// Other slots (2 - 16):
//
// +----------------+---------------+-----------------------------+----------------------------+---------------------------------+
// |                | main screen   | flashing                    | validating                 | results screen                  |
// +----------------+---------------+-----------------------------+----------------------------+---------------------------------+
// | no drive       | black         | black                       | black                      | black                           |
// +----------------+---------------+-----------------------------+----------------------------+---------------------------------+
// | drive plugged  | black         | black                       | black                      | black                           |
// +----------------+---------------+-----------------------------+----------------------------+---------------------------------+
// | drive selected | white         | blink purple, red if failed | blink green, red if failed | green if success, red if failed |
// +----------------+---------------+-----------------------------+----------------------------+---------------------------------+
export function updateLeds({
	step,
	sourceDrive,
	availableDrives,
	selectedDrives,
	failedDrives,
}: LedsState) {
	const unplugged = new Set(leds.keys());
	const plugged = new Set(availableDrives);
	const selectedOk = new Set(selectedDrives);
	const selectedFailed = new Set(failedDrives);

	// Remove selected devices from plugged set
	for (const d of selectedOk) {
		plugged.delete(d);
	}

	// Remove plugged devices from unplugged set
	for (const d of plugged) {
		unplugged.delete(d);
	}

	// Remove failed devices from selected set
	for (const d of selectedFailed) {
		selectedOk.delete(d);
	}

	// Handle source slot
	if (sourceDrive !== undefined) {
		if (unplugged.has(sourceDrive)) {
			unplugged.delete(sourceDrive);
			// TODO
			setLeds(new Set([sourceDrive]), breatheBlue, 2);
		} else if (plugged.has(sourceDrive)) {
			plugged.delete(sourceDrive);
			setLeds(new Set([sourceDrive]), blue);
		}
	}
	if (step === 'main') {
		setLeds(unplugged, black);
		setLeds(plugged, black);
		setLeds(selectedOk, white);
		setLeds(selectedFailed, white);
	} else if (step === 'flashing') {
		setLeds(unplugged, black);
		setLeds(plugged, black);
		setLeds(selectedOk, blinkPurple, 2);
		setLeds(selectedFailed, red);
	} else if (step === 'verifying') {
		setLeds(unplugged, black);
		setLeds(plugged, black);
		setLeds(selectedOk, blinkGreen, 2);
		setLeds(selectedFailed, red);
	} else if (step === 'finish') {
		setLeds(unplugged, black);
		setLeds(plugged, black);
		setLeds(selectedOk, green);
		setLeds(selectedFailed, red);
	}
}

interface DeviceFromState {
	devicePath?: string;
	device: string;
}

let ledsState: LedsState | undefined;

function stateObserver(state: typeof DEFAULT_STATE) {
	const s = state.toJS();
	let step: 'main' | 'flashing' | 'verifying' | 'finish';
	if (s.isFlashing) {
		step = s.flashState.type;
	} else {
		step = s.lastAverageFlashingSpeed == null ? 'main' : 'finish';
	}
	const availableDrives = s.availableDrives.filter(
		(d: DeviceFromState) => d.devicePath,
	);
	const sourceDrivePath = availableDrives.filter((d: DrivelistDrive) =>
		isSourceDrive(d, s.selection.image),
	)[0]?.devicePath;
	const availableDrivesPaths = availableDrives.map(
		(d: DeviceFromState) => d.devicePath,
	);
	let selectedDrivesPaths: string[];
	if (step === 'main') {
		selectedDrivesPaths = availableDrives
			.filter((d: DrivelistDrive) => s.selection.devices.includes(d.device))
			.map((d: DrivelistDrive) => d.devicePath);
	} else {
		selectedDrivesPaths = s.devicePaths;
	}
	const failedDevicePaths = s.failedDeviceErrors.map(
		([devicePath]: [string]) => devicePath,
	);
	const newLedsState = {
		step,
		sourceDrive: sourceDrivePath,
		availableDrives: availableDrivesPaths,
		selectedDrives: selectedDrivesPaths,
		failedDrives: failedDevicePaths,
	};
	if (!_.isEqual(newLedsState, ledsState)) {
		updateLeds(newLedsState);
		ledsState = newLedsState;
	}
}

export async function init(): Promise<void> {
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
		(await settings.get('ledsMapping')) || {};
	if (!_.isEmpty(ledsMapping)) {
		for (const [drivePath, ledsNames] of Object.entries(ledsMapping)) {
			leds.set('/dev/disk/by-path/' + drivePath, new RGBLed(ledsNames));
		}
		observe(_.debounce(stateObserver, 1000, { maxWait: 1000 }));
	}
}
