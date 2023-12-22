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

import * as ipc from 'node-ipc';
import { Dictionary, values } from 'lodash';

import type { MultiDestinationProgress } from 'etcher-sdk/build/multi-write';

import { toJSON } from '../shared/errors';
import { GENERAL_ERROR, SUCCESS } from '../shared/exit-codes';
import { delay } from '../shared/utils';
import { WriteOptions } from './types/types';
import { write, cleanup } from './child-writer';
import { startScanning } from './scanner';
import { getSourceMetadata } from './source-metadata';
import { DrivelistDrive } from '../shared/drive-constraints';

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
 * @summary Send a message to the IPC server
 */
function emit(channel: string, message?: any) {
	ipc.of[IPC_SERVER_ID].emit(channel, message);
}

/**
 * @summary Send a log debug message to the IPC server
 */
function log(message: string) {
	if (console?.log) {
		console.log(message);
	}
	emit('log', message);
}

/**
 * @summary Terminate the child process
 */
async function terminate(exitCode: number) {
	ipc.disconnect(IPC_SERVER_ID);
	await cleanup(Date.now());
	process.nextTick(() => {
		process.exit(exitCode || SUCCESS);
	});
}

/**
 * @summary Handle errors
 */
async function handleError(error: Error) {
	emit('error', toJSON(error));
	await delay(DISCONNECT_DELAY);
	await terminate(GENERAL_ERROR);
}

/**
 * @summary Abort handler
 * @example
 */
const onAbort = async (exitCode: number) => {
	log('Abort');
	emit('abort');
	await delay(DISCONNECT_DELAY);
	await terminate(exitCode);
};

const onSkip = async (exitCode: number) => {
	log('Skip validation');
	emit('skip');
	await delay(DISCONNECT_DELAY);
	await terminate(exitCode);
};

ipc.connectTo(IPC_SERVER_ID, () => {
	// Gracefully exit on the following cases. If the parent
	// process detects that child exit successfully but
	// no flashing information is available, then it will
	// assume that the child died halfway through.

	process.once('uncaughtException', handleError);

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

	ipc.of[IPC_SERVER_ID].on('sourceMetadata', async (params) => {
		const { selected, SourceType, auth } = JSON.parse(params);
		try {
			const sourceMatadata = await getSourceMetadata(
				selected,
				SourceType,
				auth,
			);
			emitSourceMetadata(sourceMatadata);
		} catch (error: any) {
			emitFail(error);
		}
	});

	ipc.of[IPC_SERVER_ID].on('scan', async () => {
		startScanning();
	});

	// write handler
	ipc.of[IPC_SERVER_ID].on('write', async (options: WriteOptions) => {
		// Remove leftover tmp files older than 1 hour
		cleanup(Date.now() - 60 * 60 * 1000);

		let exitCode = SUCCESS;

		ipc.of[IPC_SERVER_ID].on('cancel', () => onAbort(exitCode));

		ipc.of[IPC_SERVER_ID].on('skip', () => onSkip(exitCode));

		const results = await write(options);

		if (results.errors.length > 0) {
			results.errors = results.errors.map((error: any) => {
				return toJSON(error);
			});
			exitCode = GENERAL_ERROR;
		}

		emit('done', { results });
		await delay(DISCONNECT_DELAY);
		await terminate(exitCode);
	});

	ipc.of[IPC_SERVER_ID].on('connect', () => {
		log(
			`Successfully connected to IPC server: ${IPC_SERVER_ID}, socket root ${ipc.config.socketRoot}`,
		);
		emit('ready', {});
	});
});

function emitLog(message: string) {
	log(message);
}

function emitState(state: MultiDestinationProgress) {
	emit('state', state);
}

function emitFail(data: any) {
	emit('fail', data);
}

function emitDrives(drives: Dictionary<DrivelistDrive>) {
	emit('drives', JSON.stringify(values(drives)));
}

function emitSourceMetadata(sourceMetadata: any) {
	emit('sourceMetadata', JSON.stringify(sourceMetadata));
}

export { emitLog, emitState, emitFail, emitDrives, emitSourceMetadata };
