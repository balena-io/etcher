import { scanner as driveScanner } from './drive-scanner';
import * as sdk from 'etcher-sdk';
import type { DrivelistDrive } from '../shared/drive-constraints';
import outdent from 'outdent';
import type { Dictionary } from 'lodash';
import { values, keyBy, padStart } from 'lodash';
import { emitDrives } from './api';

let availableDrives: DrivelistDrive[] = [];

export function hasAvailableDrives() {
	return availableDrives.length > 0;
}

driveScanner.on('error', (error) => {
	// Stop the drive scanning loop in case of errors,
	// otherwise we risk presenting the same error over
	// and over again to the user, while also heavily
	// spamming our error reporting service.
	driveScanner.stop();

	console.log('scanner error', error);
});

function setDrives(drives: Dictionary<DrivelistDrive>) {
	availableDrives = values(drives);
	emitDrives(drives);
}

function getDrives() {
	return keyBy(availableDrives, 'device');
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

async function driveIsAllowed(drive: {
	devicePath: string;
	device: string;
	raw: string;
}) {
	// const driveBlacklist = (await settings.get("driveBlacklist")) || [];
	const driveBlacklist: any[] = [];
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
			link: 'https://www.raspberrypi.com/documentation/computers/compute-module.html#flashing-the-compute-module-emmc',
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
	return `0x${padStart(id.toString(USB_ID_RADIX), USB_ID_LENGTH, '0')}`;
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
const COMPUTE_MODULE_DESCRIPTIONS: Dictionary<string> = {
	[USB_PRODUCT_ID_BCM2708_BOOT]: 'Compute Module 1',
	[USB_PRODUCT_ID_BCM2710_BOOT]: 'Compute Module 3',
};

const startScanning = () => {
	driveScanner.on('attach', (drive) => addDrive(drive));
	driveScanner.on('detach', (drive) => removeDrive(drive));
	driveScanner.start();
};

const stopScanning = () => {
	driveScanner.stop();
};

export { startScanning, stopScanning };
