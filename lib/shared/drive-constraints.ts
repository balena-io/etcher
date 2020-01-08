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

import { Drive as DrivelistDrive } from 'drivelist';
import * as _ from 'lodash';
import * as pathIsInside from 'path-is-inside';
import * as prettyBytes from 'pretty-bytes';

import * as messages from './messages';

/**
 * @summary The default unknown size for things such as images and drives
 */
const UNKNOWN_SIZE = 0;

/**
 * @summary Check if a drive is locked
 *
 * @description
 * This usually points out a locked SD Card.
 */
export function isDriveLocked(drive: DrivelistDrive): boolean {
	return Boolean(_.get(drive, ['isReadOnly'], false));
}

/**
 * @summary Check if a drive is a system drive
 */
export function isSystemDrive(drive: DrivelistDrive): boolean {
	return Boolean(_.get(drive, ['isSystem'], false));
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
	image: { path: string },
): boolean {
	const mountpoints = _.get(drive, ['mountpoints'], []);
	const imagePath = _.get(image, ['path']);

	if (!imagePath || _.isEmpty(mountpoints)) {
		return false;
	}

	return _.some(
		_.map(mountpoints, mountpoint => {
			return pathIsInside(imagePath, mountpoint.path);
		}),
	);
}

/**
 * @summary Check if a drive is large enough for an image
 */
export function isDriveLargeEnough(
	drive: DrivelistDrive | undefined,
	image: { compressedSize?: number; size?: number },
): boolean {
	const driveSize = _.get(drive, 'size') || UNKNOWN_SIZE;

	if (_.get(image, ['isSizeEstimated'])) {
		// If the drive size is smaller than the original image size, and
		// the final image size is just an estimation, then we stop right
		// here, based on the assumption that the final size will never
		// be less than the original size.
		if (driveSize < _.get(image, ['compressedSize'], UNKNOWN_SIZE)) {
			return false;
		}

		// If the final image size is just an estimation then consider it
		// large enough. In the worst case, the user gets an error saying
		// the drive has ran out of space, instead of prohibiting the flash
		// at all, when the estimation may be wrong.
		return true;
	}

	return driveSize >= _.get(image, ['size'], UNKNOWN_SIZE);
}

/**
 * @summary Check if a drive is disabled (i.e. not ready for selection)
 */
export function isDriveDisabled(drive: DrivelistDrive): boolean {
	return _.get(drive, ['disabled'], false);
}

/**
 * @summary Check if a drive is valid, i.e. not locked and large enough for an image
 */
export function isDriveValid(
	drive: DrivelistDrive,
	image: { compressedSize?: number; size?: number; path: string },
): boolean {
	return (
		!isDriveLocked(drive) &&
		isDriveLargeEnough(drive, image) &&
		!isSourceDrive(drive, image) &&
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
	drive: DrivelistDrive | undefined,
	image: { recommendedDriveSize?: number },
): boolean {
	const driveSize = _.get(drive, 'size') || UNKNOWN_SIZE;
	return driveSize >= _.get(image, ['recommendedDriveSize'], UNKNOWN_SIZE);
}

/**
 * @summary 64GB
 */
export const LARGE_DRIVE_SIZE = 64e9;

/**
 * @summary Check whether a drive's size is 'large'
 */
export function isDriveSizeLarge(drive?: DrivelistDrive): boolean {
	const driveSize = _.get(drive, 'size') || UNKNOWN_SIZE;
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
	image: { isSizeEstimated?: boolean; compressedSize?: number; size?: number },
) {
	const statusList = [];

	// Mind the order of the if-statements if you modify.
	if (exports.isSourceDrive(drive, image)) {
		statusList.push({
			type: exports.COMPATIBILITY_STATUS_TYPES.ERROR,
			message: messages.compatibility.containsImage(),
		});
	} else if (exports.isDriveLocked(drive)) {
		statusList.push({
			type: exports.COMPATIBILITY_STATUS_TYPES.ERROR,
			message: messages.compatibility.locked(),
		});
	} else if (
		!_.isNil(drive) &&
		!_.isNil(drive.size) &&
		!exports.isDriveLargeEnough(drive, image)
	) {
		const imageSize = (image.isSizeEstimated
			? image.compressedSize
			: image.size) as number;
		const relativeBytes = imageSize - drive.size;
		statusList.push({
			type: exports.COMPATIBILITY_STATUS_TYPES.ERROR,
			message: messages.compatibility.tooSmall(prettyBytes(relativeBytes)),
		});
	} else {
		if (exports.isSystemDrive(drive)) {
			statusList.push({
				type: exports.COMPATIBILITY_STATUS_TYPES.WARNING,
				message: messages.compatibility.system(),
			});
		}

		if (exports.isDriveSizeLarge(drive)) {
			statusList.push({
				type: exports.COMPATIBILITY_STATUS_TYPES.WARNING,
				message: messages.compatibility.largeDrive(),
			});
		}

		if (!_.isNil(drive) && !exports.isDriveSizeRecommended(drive, image)) {
			statusList.push({
				type: exports.COMPATIBILITY_STATUS_TYPES.WARNING,
				message: messages.compatibility.sizeNotRecommended(),
			});
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
	image: { isSizeEstimated?: boolean; compressedSize?: number; size?: number },
) {
	return _.flatMap(drives, drive => {
		return getDriveImageCompatibilityStatuses(drive, image);
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
	image: { isSizeEstimated?: boolean; compressedSize?: number; size?: number },
) {
	return Boolean(getDriveImageCompatibilityStatuses(drive, image).length);
}

/**
 * @summary Does any drive/image pair have at least one compatibility status?
 * @function
 * @public
 *
 * @description
 * Given an image and a drive, return whether they have a connected compatibility status object.
 *
 * @param {Object[]} drives - drives
 * @param {Object} image - image
 * @returns {Boolean}
 *
 * @example
 * if (constraints.hasDriveImageCompatibilityStatus(drive, image)) {
 *   console.log('This drive-image pair has a compatibility status message!')
 * }
 */
export function hasListDriveImageCompatibilityStatus(
	drives: DrivelistDrive[],
	image: { isSizeEstimated?: boolean; compressedSize?: number; size?: number },
) {
	return Boolean(
		exports.getListDriveImageCompatibilityStatuses(drives, image).length,
	);
}
