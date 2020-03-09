#!/usr/src/app/node_modules/.bin/ts-node

// @ts-ignore
import { getAlignedBuffer } from '@ronomon/direct-io';
import { constants, createWriteStream, promises as fs } from 'fs';
import { resolve as resolvePath } from 'path';
// @ts-ignore
import * as RWMutex from 'rwmutex';
import { Readable } from 'stream';
import { Argv } from 'yargs';

const CHUNK_SIZE = 1024 ** 2;
const ALIGNMENT = 4096;

interface LockableBuffer extends Buffer {
	lock: () => Promise<() => void>;
	rlock: () => Promise<() => void>;
	slice: (start?: number, end?: number) => LockableBuffer;
}

function attachMutex(buf: Buffer, mutex: RWMutex): LockableBuffer {
	const buffer = buf as LockableBuffer;
	buffer.lock = mutex.lock.bind(mutex);
	buffer.rlock = mutex.rlock.bind(mutex);
	const bufferSlice = buffer.slice.bind(buffer);
	buffer.slice = (...args) => {
		const slice = bufferSlice(...args);
		return attachMutex(slice, mutex);
	};
	return buffer;
}

function createBuffer(size: number, alignment: number): LockableBuffer {
	return attachMutex(getAlignedBuffer(size, alignment), new RWMutex());
}

export class ReadStream extends Readable {
	public bytesRead = 0;
	private handle: fs.FileHandle;
	private ready: Promise<void>;
	private buffers: LockableBuffer[];
	private currentBufferIndex = 0;

	constructor(
		private debug: boolean,
		private path: string,
		private direct: boolean,
		private end?: number,
		private numBuffers = 2,
	) {
		super({
			objectMode: true,
			highWaterMark: numBuffers - 1,
		});
		if (numBuffers < 2) {
			throw new Error("numBuffers can't be less than 2");
		}
		this.buffers = new Array(numBuffers);
		this.ready = this.init();
	}

	private getCurrentBuffer(): LockableBuffer {
		let buffer = this.buffers[this.currentBufferIndex];
		if (buffer === undefined) {
			buffer = createBuffer(CHUNK_SIZE, ALIGNMENT);
			// @ts-ignore
			buffer.index = this.currentBufferIndex;
			this.buffers[this.currentBufferIndex] = buffer;
		}
		this.currentBufferIndex = (this.currentBufferIndex + 1) % this.numBuffers;
		return buffer;
	}

	private async init(): Promise<void> {
		let flags = constants.O_RDONLY;
		if (this.direct) {
			flags |= constants.O_DIRECT | constants.O_EXCL | constants.O_SYNC;
		}
		this.handle = await fs.open(this.path, flags);
	}

	public async _read() {
		await this.ready;
		const buffer = this.getCurrentBuffer();
		const unlock = await buffer.lock();
		if (this.debug) {
			// @ts-ignore
			console.log('r start', buffer.index);
		}
		const { bytesRead } = await this.handle.read(
			buffer,
			0,
			CHUNK_SIZE,
			this.bytesRead,
		);
		unlock();
		this.bytesRead += bytesRead;
		const slice = buffer.slice(0, bytesRead);
		// @ts-ignore
		slice.index = buffer.index;
		if (this.debug) {
			// @ts-ignore
			console.log('r end', buffer.index);
		}
		this.push(slice);
		if (
			bytesRead < CHUNK_SIZE ||
			(this.end !== undefined && this.bytesRead > this.end)
		) {
			this.push(null);
			await this.handle.close();
			this.emit('close');
		}
	}
}

function nTab(n: number): string {
	let result = '';
	for (let i = 0; i < n; i++) {
		result += '\t';
	}
	return result;
}

async function flash(
	numBuffers: number,
	size: number | undefined,
	inputDirect: boolean,
	outputDirect: boolean,
	debug: boolean,
	input: string,
	outputs: string[] = [],
) {
	const promises: Array<Promise<void>> = [];
	const source = new ReadStream(debug, input, inputDirect, size, numBuffers);
	source.setMaxListeners(outputs.length + 1);
	promises.push(
		new Promise((resolve, reject) => {
			source.on('close', resolve);
			source.on('error', reject);
		}),
	);
	const start = new Date().getTime();
	for (let idx = 0; idx < outputs.length; idx++) {
		const output = outputs[idx];
		let flags = constants.O_WRONLY;
		if (outputDirect) {
			flags |= constants.O_DIRECT | constants.O_EXCL | constants.O_SYNC;
		}
		const destination = createWriteStream(output, {
			objectMode: true,
			highWaterMark: Math.round(numBuffers / 2) - 1,
			// @ts-ignore (flags can be a number)
			flags,
		});
		destination._writev = undefined;
		const origWrite = destination._write.bind(destination);
		destination._write = async (...args) => {
			const origOnWrite = args[2];
			const unlock = await args[0].rlock();
			if (debug) {
				// @ts-ignore
				console.log(`${nTab(idx + 1)}w start`, args[0].index);
			}
			args[2] = (...aargs) => {
				unlock();
				if (debug) {
					console.log(`${nTab(idx + 1)}w end`, args[0].index);
				}
				// @ts-ignore
				origOnWrite(...aargs);
			};
			// @ts-ignore
			return origWrite(...args);
		};
		promises.push(
			new Promise((resolve, reject) => {
				destination.on('close', resolve);
				destination.on('error', reject);
			}),
		);
		source.pipe(destination);
	}
	await Promise.all(promises);
	const end = new Date().getTime();
	const duration = (end - start) / 1000;
	if (size === undefined) {
		size = source.bytesRead;
	}
	console.log('total time', duration, 's');
	console.log('speed', size / 1024 ** 2 / duration, 'MiB/s');
}

const argv = require('yargs').command(
	'$0 input [devices..]',
	'Write zeros to devices',
	(yargs: Argv) => {
		yargs.positional('input', { describe: 'Input device' });
		yargs.positional('devices', { describe: 'Devices to write to' });
		yargs.option('numBuffers', {
			default: 2,
			describe: 'Number of 1MiB buffers used by the reader',
		});
		yargs.option('size', {
			type: 'number',
			describe: 'Size in bytes',
		});
		yargs.option('loop', {
			type: 'boolean',
			default: false,
			describe: 'Indefinitely restart flashing when done',
		});
		yargs.option('debug', {
			type: 'boolean',
			default: false,
			describe: 'Show debug information',
		});
		yargs.option('inputDirect', {
			type: 'boolean',
			default: false,
			describe: 'Use direct io for input',
		});
		yargs.option('outputDirect', {
			type: 'boolean',
			default: false,
			describe: 'Use direct io for output',
		});
	},
).argv;

async function main() {
	if (argv.devices === undefined || argv.devices.length === 0) {
		console.error('No output devices provided');
		return;
	}
	while (true) {
		await flash(
			argv.numBuffers,
			argv.size,
			argv.inputDirect,
			argv.outputDirect,
			argv.debug,
			resolvePath(argv.input),
			argv.devices.map((f: string) => resolvePath(f)),
		);
		if (!argv.loop) {
			break;
		}
	}
}

main();
