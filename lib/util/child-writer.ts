/*
 * Copyright 2023 balena.io
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
 *
 * This file handles the writer process.
 */

import {
	OnProgressFunction,
	OnFailFunction,
	decompressThenFlash,
	DECOMPRESSED_IMAGE_PREFIX,
	MultiDestinationProgress,
} from 'etcher-sdk/build/multi-write';

import { totalmem } from 'os';

import { cleanupTmpFiles } from 'etcher-sdk/build/tmp';

import {
	File,
	Http,
	BlockDevice,
	SourceDestination,
} from 'etcher-sdk/build/source-destination';

import { WriteResult, FlashError, WriteOptions } from './types/types';

import { isJson } from '../shared/utils';
import { toJSON } from '../shared/errors';
import axios from 'axios';
import { omit } from 'lodash';
import { emitLog, emitState, emitFail } from './api';

async function write(options: WriteOptions) {
	/**
	 * @summary Failure handler (non-fatal errors)
	 * @param {SourceDestination} destination - destination
	 * @param {Error} error - error
	 */
	const onFail = (destination: SourceDestination, error: Error) => {
		emitFail({
			// TODO: device should be destination

			// @ts-ignore (destination.drive is private)
			device: destination.drive,
			error: toJSON(error),
		});
	};

	/**
	 * @summary Progress handler
	 * @param {Object} state - progress state
	 * @example
	 * writer.on('progress', onProgress)
	 */
	const onProgress = (state: MultiDestinationProgress) => {
		emitState(state);
	};

	// Write the image to the destinations
	const destinations = options.destinations.map((d) => d.device);
	const imagePath = options.image.path;
	emitLog(`Image: ${imagePath}`);
	emitLog(`Devices: ${destinations.join(', ')}`);
	emitLog(`Auto blockmapping: ${options.autoBlockmapping}`);
	emitLog(`Decompress first: ${options.decompressFirst}`);
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
				const decodedImagePath = decodeURIComponent(imagePath);
				if (isJson(decodedImagePath)) {
					const imagePathObject = JSON.parse(decodedImagePath);
					source = new Http({
						url: imagePathObject.url,
						avoidRandomAccess: true,
						axiosInstance: axios.create(omit(imagePathObject, ['url'])),
						auth: options.image.auth,
					});
				} else {
					source = new Http({
						url: imagePath,
						avoidRandomAccess: true,
						auth: options.image.auth,
					});
				}
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

		return results;
	} catch (error: any) {
		return { errors: [error] };
	}
}

/** @summary clean up tmp files */
export async function cleanup(until: number) {
	await cleanupTmpFiles(until, DECOMPRESSED_IMAGE_PREFIX);
}

/**
 * @summary writes the source to the destinations and validates the writes
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

export { write };
