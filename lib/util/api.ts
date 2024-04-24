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

import { WebSocketServer } from 'ws';
import { Dictionary, values } from 'lodash';

import type { MultiDestinationProgress } from 'etcher-sdk/build/multi-write';

import { toJSON } from '../shared/errors';
import { GENERAL_ERROR, SUCCESS } from '../shared/exit-codes';
import { WriteOptions } from './types/types';
import { write, cleanup } from './child-writer';
import { startScanning } from './scanner';
import { getSourceMetadata } from './source-metadata';
import { DrivelistDrive } from '../shared/drive-constraints';
import { SourceMetadata } from '../shared/typings/source-selector';

const ETCHER_SERVER_ADDRESS = process.env.ETCHER_SERVER_ADDRESS as string;
const ETCHER_SERVER_PORT = process.env.ETCHER_SERVER_PORT as string;
// const ETCHER_SERVER_ID = process.env.ETCHER_SERVER_ID as string;

const ETCHER_TERMINATE_TIMEOUT: number = parseInt(
	process.env.ETCHER_TERMINATE_TIMEOUT ?? '10000',
	10,
);

const host = ETCHER_SERVER_ADDRESS ?? '127.0.0.1';
const port = parseInt(ETCHER_SERVER_PORT || '3434', 10);
// const path = ETCHER_SERVER_ID || "etcher";

// TODO: use the path as cheap authentication

const wss = new WebSocketServer({ host, port });

// hold emit functions
let emitLog: (message: string) => void | undefined;
let emitState: (state: MultiDestinationProgress) => void | undefined;
let emitFail: (data: any) => void | undefined;
let emitDrives: (drives: Dictionary<DrivelistDrive>) => void | undefined;
let emitSourceMetadata: (
	sourceMetadata: SourceMetadata | Record<string, never>,
) => void | undefined; // Record<string, never> means an empty object

// Terminate the child process
async function terminate(exitCode?: number) {
	await cleanup(Date.now());
	process.nextTick(() => {
		process.exit(exitCode || SUCCESS);
	});
}

// kill the process if no initila connections or heartbeat for X sec (default 10)
function setTerminateTimeout() {
	if (ETCHER_TERMINATE_TIMEOUT > 0) {
		return setTimeout(() => {
			console.log(
				`no connections or heartbeat for ${ETCHER_TERMINATE_TIMEOUT} ms, terminating`,
			);
			terminate();
		}, ETCHER_TERMINATE_TIMEOUT);
	} else {
		return null;
	}
}

// terminate the process cleanly on SIGINT
process.once('SIGINT', async () => {
	await terminate(SUCCESS);
});

// terminate the process cleanly on SIGTERM
process.once('SIGTERM', async () => {
	await terminate(SUCCESS);
});

let terminateInterval = setTerminateTimeout();

interface EmitLog {
	emit: (channel: string, message: object | string) => void;
	log: (message: string) => void;
}

function setup(): Promise<EmitLog> {
	return new Promise((resolve, reject) => {
		wss.on('connection', (ws) => {
			console.log('connection established... setting up');

			/**
			 * @summary Send a message to the IPC server
			 */
			function emit(type: string, payload?: object | string) {
				ws.send(JSON.stringify({ type, payload }));
				// ipc.of[IPC_SERVER_ID].emit("message", { type, payload });
			}

			/**
			 * @summary Print logs and send them back to client
			 */
			function log(message: string) {
				console.log(message);
				emit('log', message);
			}

			/**
			 * @summary Handle `errors`
			 */
			async function handleError(error: Error) {
				emit('error', toJSON(error));
				await terminate(GENERAL_ERROR);
			}

			/**
			 * @summary Handle `abort` from client
			 */
			const onAbort = async (exitCode: number) => {
				log('Abort');
				emit('abort');
				await terminate(exitCode);
			};

			/**
			 * @summary Handle `skip` from client; skip validation
			 */
			const onSkip = async (exitCode: number) => {
				log('Skip validation');
				emit('skip');
				await terminate(exitCode);
			};

			/**
			 * @summary Handle `write` from client; start writing to the drives
			 */
			const onWrite = async (options: WriteOptions) => {
				log('write requested');

				// Remove leftover tmp files older than 1 hour
				cleanup(Date.now() - 60 * 60 * 1000);

				let exitCode = SUCCESS;

				// Write to the drives
				const results = await write(options);

				// handle potential errors from the write process
				if (results.errors.length > 0) {
					results.errors = results.errors.map(toJSON);
					exitCode = GENERAL_ERROR;
				}

				// send the results back to the client
				emit('done', { results });

				// terminate this process
				await terminate(exitCode);
			};

			/**
			 * @summary Handle `sourceMetadata` from client; get source metadata
			 */
			const onSourceMetadata = async (params: any) => {
				log('sourceMetadata requested');
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
			};

			// handle uncaught exceptions
			process.once('uncaughtException', handleError);

			// terminate the process if the connection is closed
			ws.on('error', async () => {
				await terminate(SUCCESS);
			});

			// route messages from the client by `type`
			const messagesHandler: any = {
				// terminate the process
				terminate: () => terminate(SUCCESS),

				/* 
				 receive a `heartbeat`, reset the terminate timeout
				 this mechanism ensure the process will be terminated if the client is disconnected
				*/
				heartbeat: () => {
					if (terminateInterval) {
						clearTimeout(terminateInterval);
					}
					terminateInterval = setTerminateTimeout();
				},

				// resolve the setup promise when the client is ready
				ready: () => {
					log('Ready ...');
					resolve({ emit, log });
				},

				// start scanning for drives
				scan: () => {
					log('Scan requested');
					startScanning();
				},

				// route `cancel` from client
				cancel: () => onAbort(GENERAL_ERROR),

				// route `skip` from client
				skip: () => onSkip(GENERAL_ERROR),

				// route `write` from client
				write: async (options: WriteOptions) => onWrite(options),

				// route `sourceMetadata` from client
				sourceMetadata: async (params: any) => onSourceMetadata(params),
			};

			// message handler, parse and route messages coming on WS
			ws.on('message', async (jsonData: any) => {
				const data = JSON.parse(jsonData);
				const message = messagesHandler[data.type];
				if (message) {
					await message(data.payload);
				} else {
					throw new Error(`Unknown message type: ${data.type}`);
				}
			});

			// inform the client that the server is ready to receive messages
			emit('ready', {});

			ws.on('error', (error) => {
				reject(error);
			});
		});
	});
}

// setTimeout(() => console.log('wss', wss.address()), 1000);
console.log('waiting for connection...');

setup().then(({ emit, log }: EmitLog) => {
	// connection is established, clear initial terminate timeout
	if (terminateInterval) {
		clearInterval(terminateInterval);
	}

	console.log('waiting for instruction...');

	// set the exportable emit functions
	emitLog = (message) => {
		log(message);
	};

	emitState = (state) => {
		emit('state', state);
	};

	emitFail = (data) => {
		emit('fail', data);
	};

	emitDrives = (drives) => {
		emit('drives', JSON.stringify(values(drives)));
	};

	emitSourceMetadata = (sourceMetadata) => {
		emit('sourceMetadata', JSON.stringify(sourceMetadata));
	};
});

export { emitLog, emitState, emitFail, emitDrives, emitSourceMetadata };
