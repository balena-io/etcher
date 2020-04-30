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

import * as _ from 'lodash';
import { lookup } from 'mime-types';

/**
 * @summary Get the extensions of a file
 *
 * @example
 * const extensions = fileExtensions.getFileExtensions('path/to/foo.img.gz');
 * console.log(extensions);
 * > [ 'img', 'gz' ]
 */
export function getFileExtensions(filePath: string): string[] {
	return _.chain(filePath).split('.').tail().map(_.toLower).value();
}

/**
 * @summary Get the last file extension
 *
 * @example
 * const extension = fileExtensions.getLastFileExtension('path/to/foo.img.gz');
 * console.log(extension);
 * > 'gz'
 */
export function getLastFileExtension(filePath: string): string | null {
	return _.last(getFileExtensions(filePath)) || null;
}

/**
 * @summary Get the penultimate file extension
 *
 * @example
 * const extension = fileExtensions.getPenultimateFileExtension('path/to/foo.img.gz');
 * console.log(extension);
 * > 'img'
 */
export function getPenultimateFileExtension(filePath: string): string | null {
	const extensions = getFileExtensions(filePath);
	if (extensions.length >= 2) {
		const ext = extensions[extensions.length - 2];
		return lookup(ext) ? ext : null;
	}
	return null;
}
