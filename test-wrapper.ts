/*
 * This is a test wrapper for etcher-utils.
 * The only use for this file is debugging while developing etcher-utils.
 * It will create a IPC server, spawn the cli version of etcher-writer, and wait for it to connect.
 * Requires elevated privileges to work (launch with sudo)
 * Note that you'll need to to edit `ipc.server.on('ready', ...` function based on what you want to test.
 */

import * as ipc from 'node-ipc';
import * as os from 'os';
import * as path from 'path';

import * as packageJSON from './package.json';
import * as permissions from './lib/shared/permissions';

// if (process.argv.length !== 3) {
// 	console.error('Expects an image to flash as only arg!');
// 	process.exit(1);
// }

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

function writerArgv(): string[] {
	const entryPoint = path.join('./generated/etcher-util');
	return [entryPoint];
}

function writerEnv() {
	return {
		IPC_SERVER_ID,
		IPC_CLIENT_ID,
		IPC_SOCKET_ROOT: ipc.config.socketRoot,
		UV_THREADPOOL_SIZE: (os.cpus().length * THREADS_PER_CPU).toString(),
		// This environment variable prevents the AppImages
		// desktop integration script from presenting the
		// "installation" dialog
		SKIP: '1',
		...(process.platform === 'win32' ? {} : process.env),
	};
}

async function start(): Promise<any> {
	ipc.serve();

	return await new Promise((resolve, reject) => {
		ipc.server.on('error', (message) => {
			console.log('IPC server error', message);
		});

		ipc.server.on('log', (message) => {
			console.log('log', message);
		});

		ipc.server.on('fail', ({ device, error }) => {
			console.log('failure', error, device);
		});

		ipc.server.on('done', (event) => {
			console.log('done', event);
		});

		ipc.server.on('abort', () => {
			console.log('abort');
		});

		ipc.server.on('skip', () => {
			console.log('skip');
		});

		ipc.server.on('state', (progress) => {
			console.log('progress', progress);
		});

		ipc.server.on('drives', (drives) => {
			console.log('drives', drives);
		});

		ipc.server.on('ready', (_data, socket) => {
			console.log('ready');
			ipc.server.emit(socket, 'scan', {});
			// ipc.server.emit(socket, "hello", { message: "world" });
			// ipc.server.emit(socket, "write", {
			// 	image: {
			// 		path: process.argv[2],
			// 		displayName: "Random image for test",
			// 		description: "Random image for test",
			// 		SourceType: "File",
			// 	},
			// 	destinations: [
			// 		{
			// 			size: 15938355200,
			// 			isVirtual: false,
			// 			enumerator: "DiskArbitration",
			// 			logicalBlockSize: 512,
			// 			raw: "/dev/rdisk4",
			// 			error: null,
			// 			isReadOnly: false,
			// 			displayName: "/dev/disk4",
			// 			blockSize: 512,
			// 			isSCSI: false,
			// 			isRemovable: true,
			// 			device: "/dev/disk4",
			// 			busVersion: null,
			// 			isSystem: false,
			// 			busType: "USB",
			// 			isCard: false,
			// 			isUSB: true,
			// 			devicePath:
			// 				"IODeviceTree:/arm-io@10F00000/usb-drd1@2280000/usb-drd1-port-hs@01100000",
			// 			mountpoints: [
			// 				{
			// 					path: "/Volumes/flash-rootB",
			// 					label: "flash-rootB",
			// 				},
			// 				{
			// 					path: "/Volumes/flash-rootA",
			// 					label: "flash-rootA",
			// 				},
			// 				{
			// 					path: "/Volumes/flash-boot",
			// 					label: "flash-boot",
			// 				},
			// 			],
			// 			description: "Generic Flash Disk Media",
			// 			isUAS: null,
			// 			partitionTableType: "mbr",
			// 		},
			// 	],
			// 	SourceType: "File",
			// 	autoBlockmapping: true,
			// 	decompressFirst: true,
			// });
		});

		const argv = writerArgv();

		ipc.server.on('start', async () => {
			console.log(`Elevating command: ${argv.join(' ')}`);
			const env = writerEnv();
			try {
				await permissions.elevateCommand(argv, {
					applicationName: packageJSON.displayName,
					environment: env,
				});
			} catch (error: any) {
				console.log('error', error);
				// This happens when the child is killed using SIGKILL
				const SIGKILL_EXIT_CODE = 137;
				if (error.code === SIGKILL_EXIT_CODE) {
					error.code = 'ECHILDDIED';
				}
				reject(error);
			} finally {
				console.log('Terminating IPC server');
			}

			resolve(true);
		});

		// Clear the update lock timer to prevent longer
		// flashing timing it out, and releasing the lock
		ipc.server.start();
	});
}

start();
