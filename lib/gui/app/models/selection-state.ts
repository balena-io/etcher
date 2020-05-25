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

import { sourceDestination } from 'etcher-sdk';
import * as _ from 'lodash';
import { GPTPartition, MBRPartition } from 'partitioninfo';
import * as path from 'path';

import * as errors from '../../../shared/errors';
import * as messages from '../../../shared/messages';
import { SourceOptions } from '../components/source-selector/source-selector';
import { replaceWindowsNetworkDriveLetter } from '../os/windows-network-drives';
import * as availableDrives from './available-drives';
import { Actions, store } from './store';

/**
 * @summary Select a drive by its device path
 */
export function selectDrive(driveDevice: string) {
	store.dispatch({
		type: Actions.SELECT_DRIVE,
		data: driveDevice,
	});
}

/**
 * @summary Toggle drive selection
 */
export function toggleDrive(driveDevice: string) {
	if (isDriveSelected(driveDevice)) {
		deselectDrive(driveDevice);
	} else {
		selectDrive(driveDevice);
	}
}

export function selectImage(image: any) {
	store.dispatch({
		type: Actions.SELECT_IMAGE,
		data: image,
	});
}

interface SourceMetadata extends sourceDestination.Metadata {
	hasMBR: boolean;
	partitions: MBRPartition[] | GPTPartition[];
	path: string;
	extension: string;
}

export async function selectImageByPath({
	imagePath,
	SourceType,
}: SourceOptions) {
	try {
		imagePath = await replaceWindowsNetworkDriveLetter(imagePath);
	} catch (error) {
		throw error;
	}

	let source;
	if (SourceType === sourceDestination.File) {
		source = new sourceDestination.File({
			path: imagePath,
		});
	} else {
		if (
			!_.startsWith(imagePath, 'https://') &&
			!_.startsWith(imagePath, 'http://')
		) {
			throw errors.createUserError({
				title: 'Unsupported protocol',
				description: messages.error.unsupportedProtocol(),
			});
		}
		source = new sourceDestination.Http({ url: imagePath });
	}

	try {
		const innerSource = await source.getInnerSource();
		const metadata = (await innerSource.getMetadata()) as SourceMetadata;
		const partitionTable = await innerSource.getPartitionTable();
		if (partitionTable) {
			metadata.hasMBR = true;
			metadata.partitions = partitionTable.partitions;
		} else {
			metadata.hasMBR = false;
		}
		metadata.path = imagePath;
		metadata.extension = path.extname(imagePath).slice(1);
		return {
			metadata,
			imagePath,
			SourceType,
		};
	} catch (error) {
		throw errors.createUserError({
			title: 'Error opening image',
			description: messages.error.openImage(
				path.basename(imagePath),
				error.message,
			),
		});
	} finally {
		try {
			await source.close();
		} catch (error) {
			// Noop
		}
	}
}

/**
 * @summary Get all selected drives' devices
 */
export function getSelectedDevices(): string[] {
	return store.getState().getIn(['selection', 'devices']).toJS();
}

/**
 * @summary Get all selected drive objects
 */
export function getSelectedDrives(): any[] {
	const drives = availableDrives.getDrives();
	return _.map(getSelectedDevices(), (device) => {
		return _.find(drives, { device });
	});
}

/**
 * @summary Get the selected image
 */
export function getImage() {
	return _.get(store.getState().toJS(), ['selection', 'image']);
}

export function getImagePath(): string {
	return _.get(store.getState().toJS(), ['selection', 'image', 'path']);
}

export function getImageSize(): number {
	return _.get(store.getState().toJS(), ['selection', 'image', 'size']);
}

export function getImageUrl(): string {
	return _.get(store.getState().toJS(), ['selection', 'image', 'url']);
}

export function getImageName(): string {
	return _.get(store.getState().toJS(), ['selection', 'image', 'name']);
}

export function getImageLogo(): string {
	return _.get(store.getState().toJS(), ['selection', 'image', 'logo']);
}

export function getImageSupportUrl(): string {
	return _.get(store.getState().toJS(), ['selection', 'image', 'supportUrl']);
}

export function getImageRecommendedDriveSize(): number {
	return _.get(store.getState().toJS(), [
		'selection',
		'image',
		'recommendedDriveSize',
	]);
}

/**
 * @summary Check if there is a selected drive
 */
export function hasDrive(): boolean {
	return Boolean(getSelectedDevices().length);
}

/**
 * @summary Check if there is a selected image
 */
export function hasImage(): boolean {
	return Boolean(getImage());
}

/**
 * @summary Remove drive from selection
 */
export function deselectDrive(driveDevice: string) {
	store.dispatch({
		type: Actions.DESELECT_DRIVE,
		data: driveDevice,
	});
}

export function deselectImage() {
	store.dispatch({
		type: Actions.DESELECT_IMAGE,
		data: {},
	});
}

export function deselectAllDrives() {
	_.each(getSelectedDevices(), deselectDrive);
}

/**
 * @summary Clear selections
 */
export function clear() {
	deselectImage();
	deselectAllDrives();
}

/**
 * @summary Check whether a given device is selected.
 */
export function isDriveSelected(driveDevice: string) {
	if (!driveDevice) {
		return false;
	}

	const selectedDriveDevices = getSelectedDevices();
	return _.includes(selectedDriveDevices, driveDevice);
}
