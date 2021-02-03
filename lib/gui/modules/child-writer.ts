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

import { Drive as DrivelistDrive } from 'drivelist';
import {
	BlockDevice,
	File,
	Http,
	Metadata,
	SourceDestination,
} from 'etcher-sdk/build/source-destination';
import {
	MultiDestinationProgress,
	OnProgressFunction,
	OnFailFunction,
	decompressThenFlash,
	DECOMPRESSED_IMAGE_PREFIX,
} from 'etcher-sdk/build/multi-write';
import { cleanupTmpFiles } from 'etcher-sdk/build/tmp';
import * as ipc from 'node-ipc';
import { totalmem } from 'os';

import { toJSON } from '../../shared/errors';
import { GENERAL_ERROR, SUCCESS } from '../../shared/exit-codes';
import { delay } from '../../shared/utils';
import { SourceMetadata } from '../app/components/source-selector/source-selector';

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
async function terminate(exitCode: number) {
	ipc.disconnect(IPC_SERVER_ID);
	await cleanupTmpFiles(Date.now(), DECOMPRESSED_IMAGE_PREFIX);
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
	await terminate(GENERAL_ERROR);
}

export interface FlashError extends Error {
	description: string;
	device: string;
	code: string;
}

export interface WriteResult {
	bytesWritten?: number;
	devices?: {
		failed: number;
		successful: number;
	};
	errors: FlashError[];
	sourceMetadata?: Metadata;
}

export interface FlashResults extends WriteResult {
	skip?: boolean;
	cancelled?: boolean;
}

/**
 * @summary writes the source to the destinations and valiates the writes
 * @param {SourceDestination} source - source
 * @param {SourceDestination[]} destinations - destinations
 * @param {Boolean} verify - whether to validate the writes or not
 * @param {Boolean} autoBlockmapping - whether to trim ext partitions before writing
 * @param {Function} onProgress - function to call on progress
 * @param {Function} onFail - function to call on fail
 * @returns {Promise<{ bytesWritten, devices, errors} >}
 */
async function writeAndValidate({
	source,
	destinations,
	verify,
	autoBlockmapping,
	decompressFirst,
	onProgress,
	onFail,
}: {
	source: SourceDestination;
	destinations: BlockDevice[];
	verify: boolean;
	autoBlockmapping: boolean;
	decompressFirst: boolean;
	onProgress: OnProgressFunction;
	onFail: OnFailFunction;
}): Promise<WriteResult> {
	const { sourceMetadata, failures, bytesWritten } = await decompressThenFlash({
		source,
		destinations,
		onFail,
		onProgress,
		verify,
		trim: autoBlockmapping,
		numBuffers: Math.min(
			2 + (destinations.length - 1) * 32,
			256,
			Math.floor(totalmem() / 1024 ** 2 / 8),
		),
		decompressFirst,
	});
	const result: WriteResult = {
		bytesWritten,
		devices: {
			failed: failures.size,
			successful: destinations.length - failures.size,
		},
		errors: [],
		sourceMetadata,
	};
	for (const [destination, error] of failures) {
		const err = error as FlashError;
		const drive = destination as BlockDevice;
		err.device = drive.device;
		err.description = drive.description;
		result.errors.push(err);
	}
	return result;
}

interface WriteOptions {
	image: SourceMetadata;
	destinations: DrivelistDrive[];
	autoBlockmapping: boolean;
	decompressFirst: boolean;
	SourceType: string;
}

ipc.connectTo(IPC_SERVER_ID, () => {
	// Remove leftover tmp files older than 1 hour
	cleanupTmpFiles(Date.now() - 60 * 60 * 1000);
	process.once('uncaughtException', handleError);

	// Gracefully exit on the following cases. If the parent
	// process detects that child exit successfully but
	// no flashing information is available, then it will
	// assume that the child died halfway through.

	process.once('SIGINT', async () => {
		await terminate(SUCCESS);
	});

	process.once('SIGTERM', async () => {
		await terminate(SUCCESS);
	});

	// The IPC server failed. Abort.
	ipc.of[IPC_SERVER_ID].on('error', async () => {
		await terminate(SUCCESS);
	});

	// The IPC server was disconnected. Abort.
	ipc.of[IPC_SERVER_ID].on('disconnect', async () => {
		await terminate(SUCCESS);
	});

	ipc.of[IPC_SERVER_ID].on('write', async (options: WriteOptions) => {
		/**
		 * @summary Progress handler
		 * @param {Object} state - progress state
		 * @example
		 * writer.on('progress', onProgress)
		 */
		const onProgress = (state: MultiDestinationProgress) => {
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
			await terminate(exitCode);
		};

		const onSkip = async () => {
			log('Skip validation');
			ipc.of[IPC_SERVER_ID].emit('skip');
			await delay(DISCONNECT_DELAY);
			await terminate(exitCode);
		};

		ipc.of[IPC_SERVER_ID].on('cancel', onAbort);

		ipc.of[IPC_SERVER_ID].on('skip', onSkip);

		/**
		 * @summary Failure handler (non-fatal errors)
		 * @param {SourceDestination} destination - destination
		 * @param {Error} error - error
		 * @example
		 * writer.on('fail', onFail)
		 */
		const onFail = (destination: SourceDestination, error: Error) => {
			ipc.of[IPC_SERVER_ID].emit('fail', {
				// TODO: device should be destination
				// @ts-ignore (destination.drive is private)
				device: destination.drive,
				error: toJSON(error),
			});
		};

		const destinations = options.destinations.map((d) => d.device);
		const imagePath = options.image.path;
		log(`Image: ${imagePath}`);
		log(`Devices: ${destinations.join(', ')}`);
		log(`Auto blockmapping: ${options.autoBlockmapping}`);
		log(`Decompress first: ${options.decompressFirst}`);
		const dests = options.destinations.map((destination) => {
			return new BlockDevice({
				drive: destination,
				unmountOnSuccess: true,
				write: true,
				direct: true,
			});
		});
		const { SourceType } = options;
		try {
			let source;
			if (options.image.drive) {
				source = new BlockDevice({
					drive: options.image.drive,
					direct: !options.autoBlockmapping,
				});
			} else {
				if (SourceType === File.name) {
					source = new File({
						path: imagePath,
					});
				} else {
					source = new Http({ url: imagePath, avoidRandomAccess: true });
				}
			}
			const results = await writeAndValidate({
				source,
				destinations: dests,
				verify: true,
				autoBlockmapping: options.autoBlockmapping,
				decompressFirst: options.decompressFirst,
				onProgress,
				onFail,
			});
			log(`Finish: ${results.bytesWritten}`);
			results.errors = results.errors.map((error) => {
				return toJSON(error);
			});
			ipc.of[IPC_SERVER_ID].emit('done', { results });
			await delay(DISCONNECT_DELAY);
			await terminate(exitCode);
		} catch (error) {
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
