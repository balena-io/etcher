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

import type { Drive as DrivelistDrive } from 'drivelist';
import type * as sdk from 'etcher-sdk';
import type { Dictionary } from 'lodash';
import * as errors from '../../../shared/errors';
import type { SourceMetadata } from '../../../shared/typings/source-selector';
import * as flashState from '../models/flash-state';
import * as settings from '../models/settings';
import * as windowProgress from '../os/window-progress';
import { spawnChildAndConnect } from './api';

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

	// Spawn the child process with privileges and wait for the connection to be made
	const { emit, registerHandler } = await spawnChildAndConnect({
		withPrivileges: true,
	});

	return await new Promise((resolve, reject) => {
		// if the connection failed, reject the promise

		const flashResults: FlashResults = {};

		const onFail = ({ device, error }: { device: any; error: any }) => {
			console.log('fail event');
			console.log(device);
			console.log(error);
			if (device.devicePath) {
				flashState.addFailedDeviceError({ device, error });
			}
			finish();
		};

		const onDone = (payload: any) => {
			console.log('CHILD: flash done', payload);
			payload.results.errors = payload.results.errors.map(
				(data: Dictionary<any> & { message: string }) => {
					return errors.fromJSON(data);
				},
			);
			flashResults.results = payload.results;
			finish();
		};

		const onAbort = () => {
			console.log('CHILD: flash aborted');
			flashResults.cancelled = true;
			finish();
		};

		const onSkip = () => {
			console.log('CHILD: validation skipped');
			flashResults.skip = true;
			finish();
		};

		const finish = () => {
			console.log('Flash results', flashResults);

			// The flash wasn't cancelled and we didn't get a 'done' event
			// Catch unexpected situation
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

			resolve(flashResults);
		};

		registerHandler('state', onProgress);
		registerHandler('fail', onFail);
		registerHandler('done', onDone);
		registerHandler('abort', onAbort);
		registerHandler('skip', onSkip);

		cancelEmitter = (cancelStatus: string) => emit('cancel', cancelStatus);

		// Now that we know we're connected we can instruct the child process to start the write
		const parameters = {
			image,
			destinations: drives,
			SourceType: image.SourceType,
			autoBlockmapping,
			decompressFirst,
		};
		console.log('params', parameters);
		emit('write', parameters);
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

	// start api and call the flasher
	try {
		const result = await write(image, drives, flashState.setProgressState);
		console.log('got results', result);
		await flashState.unsetFlashingFlag(result);
		console.log('removed flashing flag');
	} catch (error: any) {
		await flashState.unsetFlashingFlag({
			cancelled: false,
			errorCode: error.code,
		});

		windowProgress.clear();

		throw error;
	}

	windowProgress.clear();
}

/**
 * @summary Cancel write operation
 * //TODO: find a better solution to handle cancellation
 */
export async function cancel(type: string) {
	const status = type.toLowerCase();

	if (cancelEmitter) {
		cancelEmitter(status);
	}
}
