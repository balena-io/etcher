/*
 * Copyright 2016 balena.io
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

import * as electron from 'electron';
import * as sdk from 'etcher-sdk';
import * as _ from 'lodash';
import outdent from 'outdent';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { v4 as uuidV4 } from 'uuid';

import * as packageJSON from '../../../package.json';
import * as EXIT_CODES from '../../shared/exit-codes';
import * as messages from '../../shared/messages';
import * as availableDrives from './models/available-drives';
import * as flashState from './models/flash-state';
import { init as ledsInit } from './models/leds';
import * as settings from './models/settings';
import { Actions, observe, store } from './models/store';
import * as analytics from './modules/analytics';
import { scanner as driveScanner } from './modules/drive-scanner';
import * as exceptionReporter from './modules/exception-reporter';
import * as osDialog from './os/dialog';
import * as windowProgress from './os/window-progress';
import MainPage from './pages/main/MainPage';

window.addEventListener(
	'unhandledrejection',
	(event: PromiseRejectionEvent | any) => {
		// Promise: event.reason
		// Bluebird: event.detail.reason
		// Anything else: event
		const error =
			event.reason || (event.detail && event.detail.reason) || event;
		analytics.logException(error);
		event.preventDefault();
	},
);

// Set application session UUID
store.dispatch({
	type: Actions.SET_APPLICATION_SESSION_UUID,
	data: uuidV4(),
});

// Set first flashing workflow UUID
store.dispatch({
	type: Actions.SET_FLASHING_WORKFLOW_UUID,
	data: uuidV4(),
});

const applicationSessionUuid = store.getState().toJS().applicationSessionUuid;
const flashingWorkflowUuid = store.getState().toJS().flashingWorkflowUuid;

console.log(outdent`
	${outdent}
	 _____ _       _
	|  ___| |     | |
	| |__ | |_ ___| |__   ___ _ __
	|  __|| __/ __| '_ \\ / _ \\ '__|
	| |___| || (__| | | |  __/ |
	\\____/ \\__\\___|_| |_|\\___|_|

	Interested in joining the Etcher team?
	Drop us a line at join+etcher@balena.io

	Version = ${packageJSON.version}, Type = ${packageJSON.packageType}
`);

const currentVersion = packageJSON.version;

analytics.logEvent('Application start', {
	packageType: packageJSON.packageType,
	version: currentVersion,
});

const debouncedLog = _.debounce(console.log, 1000, { maxWait: 1000 });

function pluralize(word: string, quantity: number) {
	return `${quantity} ${word}${quantity === 1 ? '' : 's'}`;
}

observe(() => {
	if (!flashState.isFlashing()) {
		return;
	}
	const currentFlashState = flashState.getFlashState();
	windowProgress.set(currentFlashState);

	let eta = '';
	if (currentFlashState.eta !== undefined) {
		eta = `eta in ${currentFlashState.eta.toFixed(0)}s`;
	}
	let active = '';
	if (currentFlashState.type !== 'decompressing') {
		active = pluralize('device', currentFlashState.active);
	}
	// NOTE: There is usually a short time period between the `isFlashing()`
	// property being set, and the flashing actually starting, which
	// might cause some non-sense flashing state logs including
	// `undefined` values.
	debouncedLog(outdent({ newline: ' ' })`
		${_.capitalize(currentFlashState.type)}
		${active},
		${currentFlashState.percentage}%
		at
		${(currentFlashState.speed || 0).toFixed(2)}
		MB/s
		(total ${(currentFlashState.speed * currentFlashState.active).toFixed(2)} MB/s)
		${eta}
		with
		${pluralize('failed device', currentFlashState.failed)}
	`);
});

/**
 * @summary The radix used by USB ID numbers
 */
const USB_ID_RADIX = 16;

/**
 * @summary The expected length of a USB ID number
 */
const USB_ID_LENGTH = 4;

/**
 * @summary Convert a USB id (e.g. product/vendor) to a string
 *
 * @example
 * console.log(usbIdToString(2652))
 * > '0x0a5c'
 */
function usbIdToString(id: number): string {
	return `0x${_.padStart(id.toString(USB_ID_RADIX), USB_ID_LENGTH, '0')}`;
}

/**
 * @summary Product ID of BCM2708
 */
const USB_PRODUCT_ID_BCM2708_BOOT = 0x2763;

/**
 * @summary Product ID of BCM2710
 */
const USB_PRODUCT_ID_BCM2710_BOOT = 0x2764;

/**
 * @summary Compute module descriptions
 */
const COMPUTE_MODULE_DESCRIPTIONS: _.Dictionary<string> = {
	[USB_PRODUCT_ID_BCM2708_BOOT]: 'Compute Module 1',
	[USB_PRODUCT_ID_BCM2710_BOOT]: 'Compute Module 3',
};

async function driveIsAllowed(drive: {
	devicePath: string;
	device: string;
	raw: string;
}) {
	const driveBlacklist = (await settings.get('driveBlacklist')) || [];
	return !(
		driveBlacklist.includes(drive.devicePath) ||
		driveBlacklist.includes(drive.device) ||
		driveBlacklist.includes(drive.raw)
	);
}

type Drive =
	| sdk.sourceDestination.BlockDevice
	| sdk.sourceDestination.UsbbootDrive
	| sdk.sourceDestination.DriverlessDevice;

function prepareDrive(drive: Drive) {
	if (drive instanceof sdk.sourceDestination.BlockDevice) {
		// @ts-ignore (BlockDevice.drive is private)
		return drive.drive;
	} else if (drive instanceof sdk.sourceDestination.UsbbootDrive) {
		// This is a workaround etcher expecting a device string and a size
		// @ts-ignore
		drive.device = drive.usbDevice.portId;
		drive.size = null;
		// @ts-ignore
		drive.progress = 0;
		drive.disabled = true;
		drive.on('progress', (progress) => {
			updateDriveProgress(drive, progress);
		});
		return drive;
	} else if (drive instanceof sdk.sourceDestination.DriverlessDevice) {
		const description =
			COMPUTE_MODULE_DESCRIPTIONS[
				drive.deviceDescriptor.idProduct.toString()
			] || 'Compute Module';
		return {
			device: `${usbIdToString(
				drive.deviceDescriptor.idVendor,
			)}:${usbIdToString(drive.deviceDescriptor.idProduct)}`,
			displayName: 'Missing drivers',
			description,
			mountpoints: [],
			isReadOnly: false,
			isSystem: false,
			disabled: true,
			icon: 'warning',
			size: null,
			link:
				'https://www.raspberrypi.org/documentation/hardware/computemodule/cm-emmc-flashing.md',
			linkCTA: 'Install',
			linkTitle: 'Install missing drivers',
			linkMessage: outdent`
				Would you like to download the necessary drivers from the Raspberry Pi Foundation?
				This will open your browser.


				Once opened, download and run the installer from the "Windows Installer" section to install the drivers
			`,
		};
	}
}

function setDrives(drives: _.Dictionary<any>) {
	availableDrives.setDrives(_.values(drives));
}

function getDrives() {
	return _.keyBy(availableDrives.getDrives() || [], 'device');
}

async function addDrive(drive: Drive) {
	const preparedDrive = prepareDrive(drive);
	if (!(await driveIsAllowed(preparedDrive))) {
		return;
	}
	const drives = getDrives();
	drives[preparedDrive.device] = preparedDrive;
	setDrives(drives);
}

function removeDrive(drive: Drive) {
	const preparedDrive = prepareDrive(drive);
	const drives = getDrives();
	delete drives[preparedDrive.device];
	setDrives(drives);
}

function updateDriveProgress(
	drive: sdk.sourceDestination.UsbbootDrive,
	progress: number,
) {
	const drives = getDrives();
	// @ts-ignore
	const driveInMap = drives[drive.device];
	if (driveInMap) {
		// @ts-ignore
		drives[drive.device] = { ...driveInMap, progress };
		setDrives(drives);
	}
}

driveScanner.on('attach', addDrive);
driveScanner.on('detach', removeDrive);

driveScanner.on('error', (error) => {
	// Stop the drive scanning loop in case of errors,
	// otherwise we risk presenting the same error over
	// and over again to the user, while also heavily
	// spamming our error reporting service.
	driveScanner.stop();

	return exceptionReporter.report(error);
});

driveScanner.start();

let popupExists = false;

window.addEventListener('beforeunload', async (event) => {
	if (!flashState.isFlashing() || popupExists) {
		analytics.logEvent('Close application', {
			isFlashing: flashState.isFlashing(),
		});
		return;
	}

	// Don't close window while flashing
	event.returnValue = false;

	// Don't open any more popups
	popupExists = true;

	analytics.logEvent('Close attempt while flashing');

	try {
		const confirmed = await osDialog.showWarning({
			confirmationLabel: 'Yes, quit',
			rejectionLabel: 'Cancel',
			title: 'Are you sure you want to close Etcher?',
			description: messages.warning.exitWhileFlashing(),
		});
		if (confirmed) {
			analytics.logEvent('Close confirmed while flashing', {
				flashInstanceUuid: flashState.getFlashUuid(),
			});

			// This circumvents the 'beforeunload' event unlike
			// electron.remote.app.quit() which does not.
			electron.remote.process.exit(EXIT_CODES.SUCCESS);
		}

		analytics.logEvent('Close rejected while flashing', {
			applicationSessionUuid,
			flashingWorkflowUuid,
		});
		popupExists = false;
	} catch (error) {
		exceptionReporter.report(error);
	}
});

async function main() {
	await ledsInit();
	ReactDOM.render(
		React.createElement(MainPage),
		document.getElementById('main'),
	);
}

main();
