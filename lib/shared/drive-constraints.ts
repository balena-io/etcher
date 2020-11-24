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

import { Drive } from 'drivelist';
import * as _ from 'lodash';
import * as pathIsInside from 'path-is-inside';

import * as messages from './messages';
import { SourceMetadata } from '../gui/app/components/source-selector/source-selector';

/**
 * @summary The default unknown size for things such as images and drives
 */
const UNKNOWN_SIZE = 0;

export type DrivelistDrive = Drive & {
	disabled: boolean;
	name: string;
	path: string;
	logo: string;
	displayName: string;
};

/**
 * @summary Check if a drive is a system drive
 */
export function isSystemDrive(drive: DrivelistDrive): boolean {
	return Boolean(drive.isSystem);
}

function sourceIsInsideDrive(source: string, drive: DrivelistDrive) {
	for (const mountpoint of drive.mountpoints || []) {
		if (pathIsInside(source, mountpoint.path)) {
			return true;
		}
	}
	return false;
}

/**
 * @summary Check if a drive is source drive
 *
 * @description
 * In the context of Etcher, a source drive is a drive
 * containing the image.
 */
export function isSourceDrive(
	drive: DrivelistDrive,
	selection?: SourceMetadata,
): boolean {
	if (selection) {
		if (selection.drive) {
			return selection.drive.device === drive.device;
		}
		if (selection.path) {
			return sourceIsInsideDrive(selection.path, drive);
		}
	}
	return false;
}

/**
 * @summary Check if a drive is large enough for an image
 */
export function isDriveLargeEnough(
	drive: DrivelistDrive,
	image?: SourceMetadata,
): boolean {
	const driveSize = drive.size || UNKNOWN_SIZE;

	if (image === undefined) {
		return true;
	}

	if (image.isSizeEstimated) {
		// If the drive size is smaller than the original image size, and
		// the final image size is just an estimation, then we stop right
		// here, based on the assumption that the final size will never
		// be less than the original size.
		if (driveSize < (image.compressedSize || UNKNOWN_SIZE)) {
			return false;
		}

		// If the final image size is just an estimation then consider it
		// large enough. In the worst case, the user gets an error saying
		// the drive has ran out of space, instead of prohibiting the flash
		// at all, when the estimation may be wrong.
		return true;
	}

	return driveSize >= (image.size || UNKNOWN_SIZE);
}

/**
 * @summary Check if a drive is disabled (i.e. not ready for selection)
 */
export function isDriveDisabled(drive: DrivelistDrive): boolean {
	return drive.disabled || false;
}

/**
 * @summary Check if a drive is valid, i.e. large enough for an image
 */
export function isDriveValid(
	drive: DrivelistDrive,
	image?: SourceMetadata,
): boolean {
	return (
		isDriveLargeEnough(drive, image) &&
		!isSourceDrive(drive, image as SourceMetadata) &&
		!isDriveDisabled(drive)
	);
}

/**
 * @summary Check if a drive meets the recommended drive size suggestion
 *
 * @description
 * If the image doesn't have a recommended size, this function returns true.
 */
export function isDriveSizeRecommended(
	drive: DrivelistDrive,
	image?: SourceMetadata,
): boolean {
	const driveSize = drive.size || UNKNOWN_SIZE;
	return driveSize >= (image?.recommendedDriveSize || UNKNOWN_SIZE);
}

/**
 * @summary 128GB
 */
export const LARGE_DRIVE_SIZE = 128e9;

/**
 * @summary Check whether a drive's size is 'large'
 */
export function isDriveSizeLarge(drive: DrivelistDrive): boolean {
	const driveSize = drive.size || UNKNOWN_SIZE;
	return driveSize > LARGE_DRIVE_SIZE;
}

/**
 * @summary Drive/image compatibility status types.
 *
 * @description
 * Status types classifying what kind of message it is, i.e. error, warning.
 */
export const COMPATIBILITY_STATUS_TYPES = {
	WARNING: 1,
	ERROR: 2,
};

export const statuses = {
	locked: {
		type: COMPATIBILITY_STATUS_TYPES.ERROR,
		message: messages.compatibility.locked(),
	},
	system: {
		type: COMPATIBILITY_STATUS_TYPES.WARNING,
		message: messages.compatibility.system(),
	},
	containsImage: {
		type: COMPATIBILITY_STATUS_TYPES.ERROR,
		message: messages.compatibility.containsImage(),
	},
	large: {
		type: COMPATIBILITY_STATUS_TYPES.WARNING,
		message: messages.compatibility.largeDrive(),
	},
	small: {
		type: COMPATIBILITY_STATUS_TYPES.ERROR,
		message: messages.compatibility.tooSmall(),
	},
	sizeNotRecommended: {
		type: COMPATIBILITY_STATUS_TYPES.WARNING,
		message: messages.compatibility.sizeNotRecommended(),
	},
};

/**
 * @summary Get drive/image compatibility in an object
 *
 * @description
 * Given an image and a drive, return their compatibility status object
 * containing the status type (ERROR, WARNING), and accompanying
 * status message.
 *
 * @returns {Object[]} list of compatibility status objects
 */
export function getDriveImageCompatibilityStatuses(
	drive: DrivelistDrive,
	image: SourceMetadata | undefined,
	write: boolean,
) {
	const statusList = [];

	// Mind the order of the if-statements if you modify.
	if (drive.isReadOnly && write) {
		statusList.push({
			type: COMPATIBILITY_STATUS_TYPES.ERROR,
			message: messages.compatibility.locked(),
		});
	}
	if (
		!_.isNil(drive) &&
		!_.isNil(drive.size) &&
		!isDriveLargeEnough(drive, image)
	) {
		statusList.push(statuses.small);
	} else {
		// Avoid showing "large drive" with "system drive" status
		if (isSystemDrive(drive)) {
			statusList.push(statuses.system);
		} else if (isDriveSizeLarge(drive)) {
			statusList.push(statuses.large);
		}

		if (isSourceDrive(drive, image as SourceMetadata)) {
			statusList.push(statuses.containsImage);
		}

		if (
			image !== undefined &&
			!_.isNil(drive) &&
			!isDriveSizeRecommended(drive, image)
		) {
			statusList.push(statuses.sizeNotRecommended);
		}
	}

	return statusList;
}

/**
 * @summary Get drive/image compatibility status for many drives
 *
 * @description
 * Given an image and a list of drives, return all compatibility status objects,
 * containing the status type (ERROR, WARNING), and accompanying status message.
 */
export function getListDriveImageCompatibilityStatuses(
	drives: DrivelistDrive[],
	image: SourceMetadata | undefined,
	write: boolean,
) {
	return drives.flatMap((drive) => {
		return getDriveImageCompatibilityStatuses(drive, image, write);
	});
}

/**
 * @summary Does the drive/image pair have at least one compatibility status?
 *
 * @description
 * Given an image and a drive, return whether they have a connected compatibility status object.
 */
export function hasDriveImageCompatibilityStatus(
	drive: DrivelistDrive,
	image: SourceMetadata | undefined,
	write: boolean,
) {
	return Boolean(
		getDriveImageCompatibilityStatuses(drive, image, write).length,
	);
}

export interface DriveStatus {
	message: string;
	type: number;
}
