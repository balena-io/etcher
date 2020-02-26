#!/usr/src/app/node_modules/.bin/ts-node

import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { resolve as resolvePath } from 'path';
import { Readable } from 'stream';
import { Argv } from 'yargs';

function createReader(size: number, sourceHighWaterMark: number) {
	return createReadStream('/dev/zero', {
		end: size,
		highWaterMark: sourceHighWaterMark,
	});
}

async function flash(
	size: number,
	sourceHighWaterMark: number,
	destinationHighWaterMark: number,
	oneSource: boolean,
	devices: string[] = [],
) {
	const promises: Array<Promise<void>> = [];
	const outputs = devices.map((f: string) => resolvePath(f));
	let globalSource: Readable;
	if (oneSource) {
		globalSource = createReader(size, sourceHighWaterMark);
		promises.push(
			new Promise((resolve, reject) => {
				globalSource.on('close', resolve);
				globalSource.on('error', reject);
			}),
		);
		globalSource.setMaxListeners(outputs.length + 1);
	}
	const start = new Date().getTime();
	for (const output of outputs) {
		const destination = createWriteStream(output, {
			highWaterMark: destinationHighWaterMark,
		});
		promises.push(
			new Promise((resolve, reject) => {
				destination.on('close', resolve);
				destination.on('error', reject);
			}),
		);
		let source: Readable;
		if (globalSource !== undefined) {
			source = globalSource;
		} else {
			source = createReader(size, sourceHighWaterMark);
			promises.push(
				new Promise((resolve, reject) => {
					source.on('close', resolve);
					source.on('error', reject);
				}),
			);
		}
		source.pipe(destination);
	}
	await Promise.all(promises);
	const end = new Date().getTime();
	const duration = (end - start) / 1000;
	console.log('total time', duration, 's');
	console.log('speed', size / 1024 ** 2 / duration, 'MiB/s');
}

const argv = require('yargs').command(
	'$0 [devices..]',
	'Write zeros to devices',
	(yargs: Argv) => {
		yargs.positional('devices', { describe: 'Devices to write to' });
		yargs.option('size', {
			default: 1500 * 1024 ** 2,
			describe: 'Size in bytes',
		});
		yargs.option('sourceHighWaterMark', {
			default: 1024 ** 2,
			describe: 'Source high water mark in bytes',
		});
		yargs.option('destinationHighWaterMark', {
			default: 64 * 1024 ** 2,
			describe: 'Destinations high water mark in bytes',
		});
		yargs.option('loop', {
			type: 'boolean',
			default: false,
			describe: 'Indefinitely restart flashing when done',
		});
		yargs.option('oneSource', {
			type: 'boolean',
			default: false,
			describe: 'Use only one reader for /dev/zero',
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
			argv.size,
			argv.sourceHighWaterMark,
			argv.destinationHighWaterMark,
			argv.oneSource,
			argv.devices,
		);
		if (!argv.loop) {
			break;
		}
	}
}

main();
