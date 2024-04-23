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
import type { AnimationFunction, Color } from 'sys-class-rgb-led';
import { Animator, RGBLed } from 'sys-class-rgb-led';

import type { DrivelistDrive } from '../../../shared/drive-constraints';
import { isSourceDrive } from '../../../shared/drive-constraints';
import { getDrives } from './available-drives';
import { getSelectedDrives } from './selection-state';
import * as settings from './settings';
import { observe, store } from './store';

const leds: Map<string, RGBLed> = new Map();
const animator = new Animator([], 10);

function createAnimationFunction(
	intensityFunction: (t: number) => number,
	color: Color,
): AnimationFunction {
	return (t: number): Color => {
		const intensity = intensityFunction(t);
		return color.map((v: number) => v * intensity) as Color;
	};
}

function blink(t: number) {
	return Math.floor(t) % 2;
}

function one() {
	return 1;
}

type LEDColors = {
	green: Color;
	purple: Color;
	red: Color;
	blue: Color;
	white: Color;
	black: Color;
};

type LEDAnimationFunctions = {
	blinkGreen: AnimationFunction;
	blinkPurple: AnimationFunction;
	staticRed: AnimationFunction;
	staticGreen: AnimationFunction;
	staticBlue: AnimationFunction;
	staticWhite: AnimationFunction;
	staticBlack: AnimationFunction;
};

let ledColors: LEDColors;
let ledAnimationFunctions: LEDAnimationFunctions;

interface LedsState {
	step: 'main' | 'flashing' | 'verifying' | 'finish';
	sourceDrive: string | undefined;
	availableDrives: string[];
	selectedDrives: string[];
	failedDrives: string[];
}

function setLeds(animation: AnimationFunction, drivesPaths: Set<string>) {
	const rgbLeds: RGBLed[] = [];
	for (const path of drivesPaths) {
		const led = leds.get(path);
		if (led) {
			rgbLeds.push(led);
		}
	}
	return { animation, rgbLeds };
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
		unplugged.delete(d);
	}

	// Remove plugged devices from unplugged set
	for (const d of plugged) {
		unplugged.delete(d);
	}

	// Remove failed devices from selected set
	for (const d of selectedFailed) {
		selectedOk.delete(d);
	}

	const mapping: Array<{
		animation: AnimationFunction;
		rgbLeds: RGBLed[];
	}> = [];
	// Handle source slot
	if (sourceDrive !== undefined) {
		if (plugged.has(sourceDrive)) {
			plugged.delete(sourceDrive);
			mapping.push(
				setLeds(ledAnimationFunctions.staticBlue, new Set([sourceDrive])),
			);
		}
	}
	if (step === 'main') {
		mapping.push(
			setLeds(
				ledAnimationFunctions.staticBlack,
				new Set([...unplugged, ...plugged]),
			),
			setLeds(
				ledAnimationFunctions.staticWhite,
				new Set([...selectedOk, ...selectedFailed]),
			),
		);
	} else if (step === 'flashing') {
		mapping.push(
			setLeds(
				ledAnimationFunctions.staticBlack,
				new Set([...unplugged, ...plugged]),
			),
			setLeds(ledAnimationFunctions.blinkPurple, selectedOk),
			setLeds(ledAnimationFunctions.staticRed, selectedFailed),
		);
	} else if (step === 'verifying') {
		mapping.push(
			setLeds(
				ledAnimationFunctions.staticBlack,
				new Set([...unplugged, ...plugged]),
			),
			setLeds(ledAnimationFunctions.blinkGreen, selectedOk),
			setLeds(ledAnimationFunctions.staticRed, selectedFailed),
		);
	} else if (step === 'finish') {
		mapping.push(
			setLeds(
				ledAnimationFunctions.staticBlack,
				new Set([...unplugged, ...plugged]),
			),
			setLeds(ledAnimationFunctions.staticGreen, selectedOk),
			setLeds(ledAnimationFunctions.staticRed, selectedFailed),
		);
	}
	animator.mapping = mapping;
}

let ledsState: LedsState | undefined;

function stateObserver() {
	const s = store.getState().toJS();
	let step: 'main' | 'flashing' | 'verifying' | 'finish';
	if (s.isFlashing) {
		step = s.flashState.type;
	} else {
		step = s.lastAverageFlashingSpeed == null ? 'main' : 'finish';
	}
	const availableDrives = getDrives().filter(
		(d: DrivelistDrive) => d.devicePath,
	);
	const sourceDrivePath = availableDrives.filter((d: DrivelistDrive) =>
		isSourceDrive(d, s.selection.image),
	)[0]?.devicePath;
	const availableDrivesPaths = availableDrives.map(
		(d: DrivelistDrive) => d.devicePath,
	);
	let selectedDrivesPaths: string[];
	if (step === 'main') {
		selectedDrivesPaths = getSelectedDrives()
			.filter((drive) => drive.devicePath !== null)
			.map((drive) => drive.devicePath) as string[];
	} else {
		selectedDrivesPaths = s.devicePaths;
	}
	const failedDevicePaths = s.failedDeviceErrors.map(
		([, { devicePath }]: [string, { devicePath: string }]) => devicePath,
	);
	const newLedsState = {
		step,
		sourceDrive: sourceDrivePath,
		availableDrives: availableDrivesPaths,
		selectedDrives: selectedDrivesPaths,
		failedDrives: failedDevicePaths,
	} as LedsState;
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
		ledColors = (await settings.get('ledColors')) || {};
		ledAnimationFunctions = {
			blinkGreen: createAnimationFunction(blink, ledColors['green']),
			blinkPurple: createAnimationFunction(blink, ledColors['purple']),
			staticRed: createAnimationFunction(one, ledColors['red']),
			staticGreen: createAnimationFunction(one, ledColors['green']),
			staticBlue: createAnimationFunction(one, ledColors['blue']),
			staticWhite: createAnimationFunction(one, ledColors['white']),
			staticBlack: createAnimationFunction(one, ledColors['black']),
		};
		observe(_.debounce(stateObserver, 1000, { maxWait: 1000 }));
	}
}
