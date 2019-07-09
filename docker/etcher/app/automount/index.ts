/*
 * Copyright 2019 resin.io
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

import { execFile } from 'child_process';
import { Dirent, readdir, stat } from 'fs';
import { basename, isAbsolute, join, relative } from 'path';
import * as process from 'process';
import { Event, list, monitor } from 'udev';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);

const BLOCK = 'block';
const {
	// example: '/sys/devices/platform/soc/3f980000.usb/usb1/1-1/1-1.5/1-1.5:1.0
	AUTOMOUNT_SYSPATH,
	// example: /tmp/sources
	AUTOMOUNT_FOLDER,
} = process.env;
const mounted: Set<string> = new Set();

function isSubdir(child: string, parent: string): boolean {
	const rel = relative(parent, child);
	return !!rel && !rel.startsWith('..') && !isAbsolute(rel);
}

function eventMatches(e: Event) {
	return (
		e.DEVTYPE === 'partition' &&
		isSubdir(e.syspath, AUTOMOUNT_SYSPATH as string)
	);
}

function partitionMountpoint(e: Event): string {
	return join(AUTOMOUNT_FOLDER as string, partitionLabel(e));
}

function partitionLabel(e: Event): string {
	let result = basename(e.DEVNAME);
	if (e.ID_FS_LABEL || e.ID_FS_UUID) {
		result += ` (${e.ID_FS_LABEL || e.ID_FS_UUID})`;
	}
	return result;
}

function exec(command: string, ...args: string[]) {
	return execFileAsync(command, args);
}

async function isDirectory(path: string): Promise<boolean> {
	try {
		const stats = await statAsync(path);
		return stats.isDirectory();
	} catch (error) {
		return false;
	}
}

async function mountPartition(e: Event): Promise<void> {
	const mountpoint = partitionMountpoint(e);
	if (await isDirectory(mountpoint)) {
		await umountPartition(mountpoint, true);
	}
	await exec('mkdir', '-p', mountpoint);
	try {
		await exec('mount', '-o', 'ro', e.DEVNAME, mountpoint);
		mounted.add(mountpoint);
	} catch (error) {
		await exec('rmdir', mountpoint);
	}
}

async function umountPartition(
	mountpoint: string,
	force = false,
): Promise<void> {
	if (!mounted.has(mountpoint) && !force) {
		return;
	}
	try {
		// Lazy umount because we don't care if the target is busy, the device is no longer here anyway.
		await exec('umount', '-l', mountpoint);
	} catch (error) {
		if (!force) {
			throw error;
		}
	}
	try {
		await exec('rmdir', mountpoint);
	} catch (error) {
		if (!force) {
			throw error;
		}
	}
	mounted.delete(mountpoint);
}

async function umountAllPartitions() {
	await Promise.all([...mounted].map(p => umountPartition(p)));
}

async function cleanFolder(path: string): Promise<void> {
	// Umounts and removes all folders in path
	let entries: Dirent[];
	try {
		entries = await readdirAsync(path, { withFileTypes: true });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return;
		}
		throw error;
	}
	for (const dirent of entries) {
		if (dirent.isDirectory()) {
			await umountPartition(dirent.name, true);
		}
	}
}

async function main() {
	if (AUTOMOUNT_FOLDER === undefined || AUTOMOUNT_SYSPATH === undefined) {
		console.error('AUTOMOUNT_FOLDER and AUTOMOUNT_SYSPATH must be defined');
		return;
	}
	await cleanFolder(AUTOMOUNT_FOLDER);
	process.on('beforeExit', umountAllPartitions);
	const mon = monitor(BLOCK);
	mon.on('add', async (e: Event) => {
		if (eventMatches(e)) {
			await mountPartition(e);
		}
	});
	mon.on('remove', async (e: Event) => {
		if (eventMatches(e)) {
			await umountPartition(partitionMountpoint(e));
		}
	});
	await Promise.all(
		list(BLOCK)
			.filter(eventMatches)
			.map(mountPartition),
	);
}

main();
