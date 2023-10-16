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
import * as sdk from 'etcher-sdk';
import { Dictionary } from 'lodash';
import * as errors from '../../../shared/errors';
import { SourceMetadata } from '../../../shared/typings/source-selector';
import * as flashState from '../models/flash-state';
import * as selectionState from '../models/selection-state';
import * as settings from '../models/settings';
import * as analytics from '../modules/analytics';
import * as windowProgress from '../os/window-progress';
import { startApiAndSpawnChild } from './api';
import { terminateScanningServer } from '../app';

/**
 * @summary Handle a flash error and log it to analytics
 */
function handleErrorLogging(
	error: Error & { code: string },
	analyticsData: any,
) {
	const eventData = {
		...analyticsData,
		flashInstanceUuid: flashState.getFlashUuid(),
	};

	if (error.code === 'EVALIDATION') {
		analytics.logEvent('Validation error', eventData);
	} else if (error.code === 'EUNPLUGGED') {
		analytics.logEvent('Drive unplugged', eventData);
	} else if (error.code === 'EIO') {
		analytics.logEvent('Input/output error', eventData);
	} else if (error.code === 'ENOSPC') {
		analytics.logEvent('Out of space', eventData);
	} else if (error.code === 'ECHILDDIED') {
		analytics.logEvent('Child died unexpectedly', eventData);
	} else {
		analytics.logEvent('Flash error', {
			...eventData,
			error: errors.toJSON(error),
		});
	}
}

let cancelEmitter: (type: string) => void | undefined;

interface FlashResults {
	skip?: boolean;
	cancelled?: boolean;
	results?: {
		bytesWritten: number;
		devices: {
			failed: number;
			successful: number;
		};
		errors: Error[];
	};
}

async function performWrite(
	image: SourceMetadata,
	drives: DrivelistDrive[],
	onProgress: sdk.multiWrite.OnProgressFunction,
): Promise<{ cancelled?: boolean }> {
	const { autoBlockmapping, decompressFirst } = await settings.getAll();

	console.log({ image, drives });

	return await new Promise(async (resolve, reject) => {
		const flashResults: FlashResults = {};

		const analyticsData = {
			image,
			drives,
			driveCount: drives.length,
			uuid: flashState.getFlashUuid(),
			flashInstanceUuid: flashState.getFlashUuid(),
		};

		const onFail = ({ device, error }) => {
			console.log('fail event');
			console.log(device);
			console.log(error);
			if (device.devicePath) {
				flashState.addFailedDeviceError({ device, error });
			}
			handleErrorLogging(error, analyticsData);
			finish();
		};

		const onDone = (event) => {
			console.log('done event');
			event.results.errors = event.results.errors.map(
				(data: Dictionary<any> & { message: string }) => {
					return errors.fromJSON(data);
				},
			);
			flashResults.results = event.results;
			finish();
		};

		const onAbort = () => {
			console.log('abort event');
			flashResults.cancelled = true;
			finish();
		};

		const onSkip = () => {
			console.log('skip event');
			flashResults.skip = true;
			finish();
		};

		const finish = () => {
			console.log('Flash results', flashResults);

			// The flash wasn't cancelled and we didn't get a 'done' event
			// Catch unexepected situation
			if (
				!flashResults.cancelled &&
				!flashResults.skip &&
				flashResults.results === undefined
			) {
				console.log(flashResults);
				reject(
					errors.createUserError({
						title: 'The writer process ended unexpectedly',
						description:
							'Please try again, and contact the Etcher team if the problem persists',
					}),
				);
			}

			console.log('Terminating IPC server');
			terminateServer();
			resolve(flashResults);
		};

		// Spawn the child process with privileges and wait for the connection to be made
		const { emit, registerHandler, terminateServer } =
			await startApiAndSpawnChild({
				withPrivileges: true,
			});

		registerHandler('state', onProgress);
		registerHandler('fail', onFail);
		registerHandler('done', onDone);
		registerHandler('abort', onAbort);
		registerHandler('skip', onSkip);

		cancelEmitter = (cancelStatus: string) => emit(cancelStatus);

		// Now that we know we're connected we can instruct the child process to start the write
		const paramaters = {
			image,
			destinations: drives,
			SourceType: image.SourceType,
			autoBlockmapping,
			decompressFirst,
		};
		console.log('params', paramaters);
		emit('write', paramaters);
	});

	// The process continue in the event handler
}

/**
 * @summary Flash an image to drives
 */
export async function flash(
	image: SourceMetadata,
	drives: DrivelistDrive[],
	// This function is a parameter so it can be mocked in tests
	write = performWrite,
): Promise<void> {
	if (flashState.isFlashing()) {
		throw new Error('There is already a flash in progress');
	}

	await flashState.setFlashingFlag();

	flashState.setDevicePaths(
		drives.map((d) => d.devicePath).filter((p) => p != null) as string[],
	);

	const analyticsData = {
		image,
		drives,
		driveCount: drives.length,
		uuid: flashState.getFlashUuid(),
		status: 'started',
		flashInstanceUuid: flashState.getFlashUuid(),
	};

	analytics.logEvent('Flash', analyticsData);

	// start api and call the flasher
	try {
		const result = await write(image, drives, flashState.setProgressState);
		await flashState.unsetFlashingFlag(result);
	} catch (error: any) {
		await flashState.unsetFlashingFlag({
			cancelled: false,
			errorCode: error.code,
		});

		windowProgress.clear();

		const { results = {} } = flashState.getFlashResults();

		const eventData = {
			...analyticsData,
			errors: results.errors,
			devices: results.devices,
			status: 'failed',
			error,
		};
		analytics.logEvent('Write failed', eventData);
		throw error;
	}

	windowProgress.clear();

	if (flashState.wasLastFlashCancelled()) {
		const eventData = {
			...analyticsData,
			status: 'cancel',
		};
		analytics.logEvent('Elevation cancelled', eventData);
	} else {
		const { results = {} } = flashState.getFlashResults();
		const eventData = {
			...analyticsData,
			errors: results.errors,
			devices: results.devices,
			status: 'finished',
			bytesWritten: results.bytesWritten,
			sourceMetadata: results.sourceMetadata,
		};
		analytics.logEvent('Done', eventData);
	}
}

/**
 * @summary Cancel write operation
 * //TODO: find a better solution to handle cancellation
 */
export async function cancel(type: string) {
	const status = type.toLowerCase();
	const drives = selectionState.getSelectedDevices();
	const analyticsData = {
		image: selectionState.getImage()?.path,
		drives,
		driveCount: drives.length,
		uuid: flashState.getFlashUuid(),
		flashInstanceUuid: flashState.getFlashUuid(),
		status,
	};
	analytics.logEvent('Cancel', analyticsData);

	if (cancelEmitter) {
		cancelEmitter(status);
	}
}
