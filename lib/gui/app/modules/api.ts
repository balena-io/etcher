/** This function will :
 * 	- start the ipc server (api)
 *  - spawn the child process (privileged or not)
 *  - wait for the child process to connect to the api
 *  - return a promise that will resolve with the emit function for the api
 *
 * //TODO:
 *  - this should be refactored to reverse the control flow:
 *    - the child process should be the server
 *    - this should be the client
 *  - replace the current node-ipc api with a websocket api
 *  - centralise the api for both the writer and the scanner instead of having two instances running
 */

import * as ipc from 'node-ipc';
import { spawn } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as packageJSON from '../../../../package.json';
import * as permissions from '../../../shared/permissions';
import * as errors from '../../../shared/errors';

const THREADS_PER_CPU = 16;

// NOTE: Ensure this isn't disabled, as it will cause
// the stdout maxBuffer size to be exceeded when flashing
ipc.config.silent = true;

async function writerArgv(): Promise<string[]> {
	let entryPoint = await window.etcher.getEtcherUtilPath();
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
		return [entryPoint];
	}
}

function writerEnv(
	IPC_CLIENT_ID: string,
	IPC_SERVER_ID: string,
	IPC_SOCKET_ROOT: string,
) {
	return {
		IPC_SERVER_ID,
		IPC_CLIENT_ID,
		IPC_SOCKET_ROOT,
		UV_THREADPOOL_SIZE: (os.cpus().length * THREADS_PER_CPU).toString(),
		// This environment variable prevents the AppImages
		// desktop integration script from presenting the
		// "installation" dialog
		SKIP: '1',
		...(process.platform === 'win32' ? {} : process.env),
	};
}

async function spawnChild({
	withPrivileges,
	IPC_CLIENT_ID,
	IPC_SERVER_ID,
	IPC_SOCKET_ROOT,
}: {
	withPrivileges: boolean;
	IPC_CLIENT_ID: string;
	IPC_SERVER_ID: string;
	IPC_SOCKET_ROOT: string;
}) {
	const argv = await writerArgv();
	const env = writerEnv(IPC_CLIENT_ID, IPC_SERVER_ID, IPC_SOCKET_ROOT);
	if (withPrivileges) {
		return await permissions.elevateCommand(argv, {
			applicationName: packageJSON.displayName,
			environment: env,
		});
	} else {
		const process = await spawn(argv[0], argv.slice(1), {
			env,
		});
		return { cancelled: false, process };
	}
}

function terminateServer(server: any) {
	// Turns out we need to destroy all sockets for
	// the server to actually close. Otherwise, it
	// just stops receiving any further connections,
	// but remains open if there are active ones.
	// @ts-ignore (no Server.sockets in @types/node-ipc)
	for (const socket of server.sockets) {
		socket.destroy();
	}
	server.stop();
}

// TODO: replace the custom ipc events by one generic "message" for all communication with the backend
function startApiAndSpawnChild({
	withPrivileges,
}: {
	withPrivileges: boolean;
}): Promise<any> {
	// There might be multiple Etcher instances running at
	// the same time, also we might spawn multiple child and api so we must ensure each IPC
	// server/client has a different name.
	const IPC_SERVER_ID = `etcher-server-${process.pid}-${Date.now()}-${
		withPrivileges ? 'privileged' : 'unprivileged'
	}`;
	const IPC_CLIENT_ID = `etcher-client-${process.pid}-${Date.now()}-${
		withPrivileges ? 'privileged' : 'unprivileged'
	}`;

	const IPC_SOCKET_ROOT = path.join(
		process.env.XDG_RUNTIME_DIR || os.tmpdir(),
		path.sep,
	);

	ipc.config.id = IPC_SERVER_ID;
	ipc.config.socketRoot = IPC_SOCKET_ROOT;

	return new Promise((resolve, reject) => {
		ipc.serve();

		// parse and route messages
		const messagesHandler: any = {
			log: (message: any) => {
				console.log(message);
			},

			error: (error: any) => {
				terminateServer(ipc.server);
				const errorObject = errors.fromJSON(error);
				reject(errorObject);
			},

			// once api is ready (means child process is connected) we pass the emit and terminate function to the caller
			ready: (_: any, socket: any) => {
				const emit = (type: string, payload: any) => {
					ipc.server.emit(socket, 'message', { type, payload });
				};
				resolve({
					emit,
					terminateServer: () => terminateServer(ipc.server),
					registerHandler,
				});
			},
		};

		ipc.server.on('message', (data: any, socket: any) => {
			const message = messagesHandler[data.type];
			if (message) {
				message(data.payload, socket);
			} else {
				throw new Error(`Unknown message type: ${data.type}`);
			}
		});

		// api to register more handlers with callbacks
		const registerHandler = (event: string, handler: any) => {
			messagesHandler[event] = handler;
		};

		// when the api is started we spawn the child process
		ipc.server.on('start', async () => {
			try {
				const results = await spawnChild({
					withPrivileges,
					IPC_CLIENT_ID,
					IPC_SERVER_ID,
					IPC_SOCKET_ROOT,
				});
				// this will happen if the child is spawned withPrivileges and privileges has been rejected
				if (results.cancelled) {
					reject();
				}
			} catch (error) {
				reject(error);
			}
		});

		// start the server
		ipc.server.start();
	});
}

export { startApiAndSpawnChild };
