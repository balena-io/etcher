/*
 * Copyright 2019 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

/*
 * This code is etcher-pro specific, its purpose is to automatically mount / umount
 * all the partitions of the selected source drive when it is inserted / removed.
 *
 * Call setSourceDevice(deviceSyspath, raw) to set the source drive:
 * deviceSyspath is the udev syspath of the drive;
 * example: '/sys/devices/pci0000:00/0000:00:14.0/usb2/2-3/2-3.1/2-3.1.4/2-3.1.4:1.0/host3/target3:0:0/3:0:0:0/block/sda',
 * if raw is true, no partitions will be mounted.
 * Calling setSourceDevice automatically umounts all partitions that may have been mounted before.
 *
 * getSourceDevice returns the currently selected drive syspath and raw.
 *
 * umountAllPartitions is exported so you can call it on exit.
 */

import { execFile } from 'child_process';
import { basename, dirname, join } from 'path';
import * as udev from 'udev';
import { promisify } from 'util';

// settings is a js module
// @ts-ignore
import { load } from '../models/settings';

let list: typeof udev.list;
let monitor: typeof udev.monitor;

const execFileAsync = promisify(execFile);

let enabled = false;
let device: string | undefined;
let raw: boolean = false;
let sourceMountpoint = '/tmp/sources';
const mounted: Set<string> = new Set();

function eventMatches(e: udev.Event) {
	return e.DEVTYPE === 'partition' && dirname(e.syspath) === device;
}

function partitionMountpoint(e: udev.Event): string {
	return join(sourceMountpoint, partitionLabel(e));
}

function partitionLabel(e: udev.Event): string {
	let result = basename(e.DEVNAME);
	if (e.ID_FS_LABEL || e.ID_FS_UUID) {
		result += ` (${e.ID_FS_LABEL || e.ID_FS_UUID})`;
	}
	return result;
}

function exec(command: string, ...args: string[]) {
	return execFileAsync(command, args, { env: { LANG: 'C' } });
}

async function mountPartition(e: udev.Event): Promise<void> {
	const mountpoint = partitionMountpoint(e);
	await exec('mkdir', '-p', mountpoint);
	try {
		await exec('mount', e.DEVNAME, mountpoint);
		mounted.add(mountpoint);
	} catch (error) {
		await exec('rmdir', mountpoint);
	}
}

async function umountPartition(mountpoint: string): Promise<void> {
	if (!mounted.has(mountpoint)) {
		return;
	}
	await exec('umount', mountpoint);
	await exec('rmdir', mountpoint);
	mounted.delete(mountpoint);
}

export async function umountAllPartitions() {
	if (!enabled) {
		return;
	}
	await Promise.all([...mounted].map(umountPartition));
}

export function getSourceDevice() {
	return { device, raw };
}

export async function setSourceDevice($device: string, $raw = false) {
	if (!enabled) {
		return;
	}
	await umountAllPartitions();
	device = $device;
	raw = $raw;
	if (!raw) {
		await Promise.all(
			list('block')
				.filter(eventMatches)
				.map(mountPartition),
		);
	}
}

export async function init() {
	const config = await load();
	if (!config.isEtcherPro) {
		return;
	}
	enabled = true;

	try {
		({ list, monitor } = await import('udev'));
	} catch (error) {
		// This only works on linux
	}

	const mon = monitor('block');

	mon.on('add', async (e: udev.Event) => {
		if (eventMatches(e)) {
			await mountPartition(e);
		}
	});

	mon.on('remove', async (e: udev.Event) => {
		if (eventMatches(e)) {
			await umountPartition(partitionMountpoint(e));
		}
	});

	if (config.sourceDeviceMountpoint) {
		sourceMountpoint = config.sourceDeviceMountpoint;
	}
	if (config.sourceDeviceSyspath) {
		await setSourceDevice(config.sourceDeviceSyspath, false);
	}
}
