import { DrivelistDrive } from '../../../shared/drive-constraints';
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

import { SourceMetadata } from '../components/source-selector/source-selector';

import * as availableDrives from './available-drives';
import { Actions, store } from './store';

/**
 * @summary Select a drive by its device path
 */
export function selectDrive(driveDevice: string) {
	store.dispatch({
		type: Actions.SELECT_TARGET,
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

export function selectSource(source: SourceMetadata) {
	store.dispatch({
		type: Actions.SELECT_SOURCE,
		data: source,
	});
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
export function getSelectedDrives(): DrivelistDrive[] {
	const selectedDevices = getSelectedDevices();
	return availableDrives
		.getDrives()
		.filter((drive) => selectedDevices.includes(drive.device));
}

/**
 * @summary Get the selected image
 */
export function getImage(): SourceMetadata | undefined {
	return store.getState().toJS().selection.image;
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
	return getImage() !== undefined;
}

/**
 * @summary Remove drive from selection
 */
export function deselectDrive(driveDevice: string) {
	store.dispatch({
		type: Actions.DESELECT_TARGET,
		data: driveDevice,
	});
}

export function deselectImage() {
	store.dispatch({
		type: Actions.DESELECT_SOURCE,
		data: {},
	});
}

export function deselectAllDrives() {
	getSelectedDevices().forEach(deselectDrive);
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
	return selectedDriveDevices.includes(driveDevice);
}
