/*
 * Copyright 2017 balena.io
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

import { delay } from 'bluebird';
import { Drive as DrivelistDrive } from 'drivelist';
import * as sdk from 'etcher-sdk';
import * as _ from 'lodash';
import * as ipc from 'node-ipc';

import { toJSON } from '../../shared/errors';
import { GENERAL_ERROR, SUCCESS } from '../../shared/exit-codes';

ipc.config.id = process.env.IPC_CLIENT_ID as string;
ipc.config.socketRoot = process.env.IPC_SOCKET_ROOT as string;

// NOTE: Ensure this isn't disabled, as it will cause
// the stdout maxBuffer size to be exceeded when flashing
ipc.config.silent = true;

// > If set to 0, the client will NOT try to reconnect.
// See https://github.com/RIAEvangelist/node-ipc/
//
// The purpose behind this change is for this process
// to emit a "disconnect" event as soon as the GUI
// process is closed, so we can kill this process as well.
// @ts-ignore (0 is a valid value for stopRetrying and is not the same as false)
ipc.config.stopRetrying = 0;

const DISCONNECT_DELAY = 100;
const IPC_SERVER_ID = process.env.IPC_SERVER_ID as string;

/**
 * @summary Send a log debug message to the IPC server
 */
function log(message: string) {
	ipc.of[IPC_SERVER_ID].emit('log', message);
}

/**
 * @summary Terminate the child writer process
 */
function terminate(exitCode: number) {
	ipc.disconnect(IPC_SERVER_ID);
	process.nextTick(() => {
		process.exit(exitCode || SUCCESS);
	});
}

/**
 * @summary Handle a child writer error
 */
async function handleError(error: Error) {
	ipc.of[IPC_SERVER_ID].emit('error', toJSON(error));
	await delay(DISCONNECT_DELAY);
	terminate(GENERAL_ERROR);
}

interface WriteResult {
	bytesWritten: number;
	devices: {
		failed: number;
		successful: number;
	};
	errors: Array<Error & { device: string }>;
}

/**
 * @summary writes the source to the destinations and valiates the writes
 * @param {SourceDestination} source - source
 * @param {SourceDestination[]} destinations - destinations
 * @param {Boolean} verify - whether to validate the writes or not
 * @param {Boolean} trim - whether to trim ext partitions before writing
 * @param {Function} onProgress - function to call on progress
 * @param {Function} onFail - function to call on fail
 * @returns {Promise<{ bytesWritten, devices, errors} >}
 */
async function writeAndValidate(
	source: sdk.sourceDestination.SourceDestination,
	destinations: sdk.sourceDestination.BlockDevice[],
	verify: boolean,
	trim: boolean,
	onProgress: sdk.multiWrite.OnProgressFunction,
	onFail: sdk.multiWrite.OnFailFunction,
): Promise<WriteResult> {
	let innerSource: sdk.sourceDestination.SourceDestination = await source.getInnerSource();
	if (trim && (await innerSource.canRead())) {
		innerSource = new sdk.sourceDestination.ConfiguredSource({
			source: innerSource,
			shouldTrimPartitions: trim,
			createStreamFromDisk: true,
		});
	}
	const {
		failures,
		bytesWritten,
	} = await sdk.multiWrite.pipeSourceToDestinations(
		innerSource,
		destinations,
		onFail,
		onProgress,
		verify,
		32,
	);
	const result: WriteResult = {
		bytesWritten,
		devices: {
			failed: failures.size,
			successful: destinations.length - failures.size,
		},
		errors: [],
	};
	for (const [destination, error] of failures) {
		const err = error as Error & { device: string };
		err.device = (destination as sdk.sourceDestination.BlockDevice).device;
		result.errors.push(err);
	}
	return result;
}

interface WriteOptions {
	imagePath: string;
	destinations: DrivelistDrive[];
	unmountOnSuccess: boolean;
	validateWriteOnSuccess: boolean;
	trim: boolean;
}

ipc.connectTo(IPC_SERVER_ID, () => {
	process.once('uncaughtException', handleError);

	// Gracefully exit on the following cases. If the parent
	// process detects that child exit successfully but
	// no flashing information is available, then it will
	// assume that the child died halfway through.

	process.once('SIGINT', () => {
		terminate(SUCCESS);
	});

	process.once('SIGTERM', () => {
		terminate(SUCCESS);
	});

	// The IPC server failed. Abort.
	ipc.of[IPC_SERVER_ID].on('error', () => {
		terminate(SUCCESS);
	});

	// The IPC server was disconnected. Abort.
	ipc.of[IPC_SERVER_ID].on('disconnect', () => {
		terminate(SUCCESS);
	});

	ipc.of[IPC_SERVER_ID].on('write', async (options: WriteOptions) => {
		/**
		 * @summary Progress handler
		 * @param {Object} state - progress state
		 * @example
		 * writer.on('progress', onProgress)
		 */
		const onProgress = (state: sdk.multiWrite.MultiDestinationProgress) => {
			ipc.of[IPC_SERVER_ID].emit('state', state);
		};

		let exitCode = SUCCESS;

		/**
		 * @summary Abort handler
		 * @example
		 * writer.on('abort', onAbort)
		 */
		const onAbort = async () => {
			log('Abort');
			ipc.of[IPC_SERVER_ID].emit('abort');
			await delay(DISCONNECT_DELAY);
			terminate(exitCode);
		};

		ipc.of[IPC_SERVER_ID].on('cancel', onAbort);

		/**
		 * @summary Failure handler (non-fatal errors)
		 * @param {SourceDestination} destination - destination
		 * @param {Error} error - error
		 * @example
		 * writer.on('fail', onFail)
		 */
		const onFail = (
			destination: sdk.sourceDestination.BlockDevice,
			error: Error,
		) => {
			ipc.of[IPC_SERVER_ID].emit('fail', {
				// TODO: device should be destination
				// @ts-ignore (destination.drive is private)
				device: destination.drive,
				error: toJSON(error),
			});
		};

		const destinations = _.map(options.destinations, 'device');
		log(`Image: ${options.imagePath}`);
		log(`Devices: ${destinations.join(', ')}`);
		log(`Umount on success: ${options.unmountOnSuccess}`);
		log(`Validate on success: ${options.validateWriteOnSuccess}`);
		log(`Trim: ${options.trim}`);
		const dests = _.map(options.destinations, destination => {
			return new sdk.sourceDestination.BlockDevice({
				drive: destination,
				unmountOnSuccess: options.unmountOnSuccess,
				write: true,
				direct: true,
			});
		});
		const source = new sdk.sourceDestination.File({
			path: options.imagePath,
		});
		try {
			const results = await writeAndValidate(
				source,
				dests,
				options.validateWriteOnSuccess,
				options.trim,
				onProgress,
				onFail,
			);
			log(`Finish: ${results.bytesWritten}`);
			results.errors = _.map(results.errors, error => {
				return toJSON(error);
			});
			ipc.of[IPC_SERVER_ID].emit('done', { results });
			await delay(DISCONNECT_DELAY);
			terminate(exitCode);
		} catch (error) {
			log(`Error: ${error.message}`);
			exitCode = GENERAL_ERROR;
			ipc.of[IPC_SERVER_ID].emit('error', toJSON(error));
		}
	});

	ipc.of[IPC_SERVER_ID].on('connect', () => {
		log(
			`Successfully connected to IPC server: ${IPC_SERVER_ID}, socket root ${ipc.config.socketRoot}`,
		);
		ipc.of[IPC_SERVER_ID].emit('ready', {});
	});
});
