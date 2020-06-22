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

import { basename } from 'path';

export const SUPPORTED_EXTENSIONS = [
	'bin',
	'bz2',
	'dmg',
	'dsk',
	'etch',
	'gz',
	'hddimg',
	'img',
	'iso',
	'raw',
	'rpi-sdimg',
	'sdcard',
	'vhd',
	'wic',
	'xz',
	'zip',
];

export function looksLikeWindowsImage(imagePath: string): boolean {
	const regex = /windows|win7|win8|win10|winxp/i;
	return regex.test(basename(imagePath));
}
