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
import * as electron from 'electron';
import * as sdk from 'etcher-sdk';
import * as _ from 'lodash';
import * as ipc from 'node-ipc';
import * as os from 'os';
import * as path from 'path';

import * as packageJSON from '../../../../package.json';
import * as errors from '../../../shared/errors';
import * as permissions from '../../../shared/permissions';
import * as flashState from '../models/flash-state';
import * as selectionState from '../models/selection-state';
import * as settings from '../models/settings';
import { store } from '../models/store';
import * as analytics from '../modules/analytics';
import * as windowProgress from '../os/window-progress';
import { updateLock } from './update-lock';

const THREADS_PER_CPU = 16;

// There might be multiple Etcher instances running at
// the same time, therefore we must ensure each IPC
// server/client has a different name.
const IPC_SERVER_ID = `etcher-server-${process.pid}`;
const IPC_CLIENT_ID = `etcher-client-${process.pid}`;

ipc.config.id = IPC_SERVER_ID;
ipc.config.socketRoot = path.join(
	process.env.XDG_RUNTIME_DIR || os.tmpdir(),
	path.sep,
);

// NOTE: Ensure this isn't disabled, as it will cause
// the stdout maxBuffer size to be exceeded when flashing
ipc.config.silent = true;

/**
 * @summary Handle a flash error and log it to analytics
 */
function handleErrorLogging(
	error: Error & { code: string },
	analyticsData: any,
) {
	const eventData = {
		...analyticsData,
		applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
		flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
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

function terminateServer() {
	// Turns out we need to destroy all sockets for
	// the server to actually close. Otherwise, it
	// just stops receiving any further connections,
	// but remains open if there are active ones.
	// @ts-ignore (no Server.sockets in @types/node-ipc)
	for (const socket of ipc.server.sockets) {
		socket.destroy();
	}
	ipc.server.stop();
}

function writerArgv(): string[] {
	let entryPoint = electron.remote.app.getAppPath();
	// AppImages run over FUSE, so the files inside the mount point
	// can only be accessed by the user that mounted the AppImage.
	// This means we can't re-spawn Etcher as root from the same
	// mount-point, and as a workaround, we re-mount the original
	// AppImage as root.
	if (os.platform() === 'linux' && process.env.APPIMAGE && process.env.APPDIR) {
		entryPoint = entryPoint.replace(process.env.APPDIR, '');
		return [
			process.env.APPIMAGE,
			'-e',
			`require(\`\${process.env.APPDIR}${entryPoint}\`)`,
		];
	} else {
		return [process.argv[0], entryPoint];
	}
}

function writerEnv() {
	return {
		IPC_SERVER_ID,
		IPC_CLIENT_ID,
		IPC_SOCKET_ROOT: ipc.config.socketRoot,
		ELECTRON_RUN_AS_NODE: '1',
		UV_THREADPOOL_SIZE: (os.cpus().length * THREADS_PER_CPU).toString(),
		// This environment variable prevents the AppImages
		// desktop integration script from presenting the
		// "installation" dialog
		SKIP: '1',
		...(process.platform === 'win32' ? {} : process.env),
	};
}

interface FlashResults {
	cancelled?: boolean;
}

/**
 * @summary Perform write operation
 *
 * @description
 * This function is extracted for testing purposes.
 */
export function performWrite(
	image: string,
	drives: DrivelistDrive[],
	onProgress: sdk.multiWrite.OnProgressFunction,
): Promise<{ cancelled?: boolean }> {
	let cancelled = false;
	ipc.serve();
	return new Promise((resolve, reject) => {
		ipc.server.on('error', error => {
			terminateServer();
			const errorObject = errors.fromJSON(error);
			reject(errorObject);
		});

		ipc.server.on('log', message => {
			console.log(message);
		});

		const flashResults: FlashResults = {};
		const analyticsData = {
			image,
			drives,
			driveCount: drives.length,
			uuid: flashState.getFlashUuid(),
			flashInstanceUuid: flashState.getFlashUuid(),
			unmountOnSuccess: settings.get('unmountOnSuccess'),
			validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
			trim: settings.get('trim'),
		};

		ipc.server.on('fail', ({ error }) => {
			handleErrorLogging(error, analyticsData);
		});

		ipc.server.on('done', event => {
			event.results.errors = _.map(event.results.errors, data => {
				return errors.fromJSON(data);
			});
			_.merge(flashResults, event);
		});

		ipc.server.on('abort', () => {
			terminateServer();
			cancelled = true;
		});

		ipc.server.on('state', onProgress);

		ipc.server.on('ready', (_data, socket) => {
			ipc.server.emit(socket, 'write', {
				imagePath: image,
				destinations: drives,
				validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
				trim: settings.get('trim'),
				unmountOnSuccess: settings.get('unmountOnSuccess'),
			});
		});

		const argv = writerArgv();

		ipc.server.on('start', async () => {
			console.log(`Elevating command: ${_.join(argv, ' ')}`);
			const env = writerEnv();
			try {
				const results = await permissions.elevateCommand(argv, {
					applicationName: packageJSON.displayName,
					environment: env,
				});
				flashResults.cancelled = cancelled || results.cancelled;
			} catch (error) {
				// This happens when the child is killed using SIGKILL
				const SIGKILL_EXIT_CODE = 137;
				if (error.code === SIGKILL_EXIT_CODE) {
					error.code = 'ECHILDDIED';
				}
				reject(error);
			} finally {
				console.log('Terminating IPC server');
				terminateServer();
			}
			console.log('Flash results', flashResults);

			// This likely means the child died halfway through
			if (
				!flashResults.cancelled &&
				!_.get(flashResults, ['results', 'bytesWritten'])
			) {
				reject(
					errors.createUserError({
						title: 'The writer process ended unexpectedly',
						description:
							'Please try again, and contact the Etcher team if the problem persists',
						code: 'ECHILDDIED',
					}),
				);
				return;
			}
			resolve(flashResults);
		});

		// Clear the update lock timer to prevent longer
		// flashing timing it out, and releasing the lock
		updateLock.pause();
		ipc.server.start();
	});
}

/**
 * @summary Flash an image to drives
 */
export async function flash(
	image: string,
	drives: DrivelistDrive[],
): Promise<void> {
	if (flashState.isFlashing()) {
		throw new Error('There is already a flash in progress');
	}

	flashState.setFlashingFlag();

	const analyticsData = {
		image,
		drives,
		driveCount: drives.length,
		uuid: flashState.getFlashUuid(),
		status: 'started',
		flashInstanceUuid: flashState.getFlashUuid(),
		unmountOnSuccess: settings.get('unmountOnSuccess'),
		validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
		trim: settings.get('trim'),
		applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
		flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
	};

	analytics.logEvent('Flash', analyticsData);

	try {
		// Using it from exports so it can be mocked during tests
		const result = await exports.performWrite(
			image,
			drives,
			flashState.setProgressState,
		);
		flashState.unsetFlashingFlag(result);
	} catch (error) {
		flashState.unsetFlashingFlag({ cancelled: false, errorCode: error.code });
		windowProgress.clear();
		let { results } = flashState.getFlashResults();
		results = results || {};
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
		const { results } = flashState.getFlashResults();
		const eventData = {
			...analyticsData,
			errors: results.errors,
			devices: results.devices,
			status: 'finished',
		};
		analytics.logEvent('Done', eventData);
	}
}

/**
 * @summary Cancel write operation
 */
export function cancel() {
	const drives = selectionState.getSelectedDevices();
	const analyticsData = {
		image: selectionState.getImagePath(),
		drives,
		driveCount: drives.length,
		uuid: flashState.getFlashUuid(),
		flashInstanceUuid: flashState.getFlashUuid(),
		unmountOnSuccess: settings.get('unmountOnSuccess'),
		validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
		trim: settings.get('trim'),
		applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
		flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
		status: 'cancel',
	};
	analytics.logEvent('Cancel', analyticsData);

	// Re-enable lock release on inactivity
	updateLock.resume();

	try {
		// @ts-ignore (no Server.sockets in @types/node-ipc)
		const [socket] = ipc.server.sockets;
		if (socket !== undefined) {
			ipc.server.emit(socket, 'cancel');
		}
	} catch (error) {
		analytics.logException(error);
	}
}
