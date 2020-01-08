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

import * as sdk from 'etcher-sdk';
import * as _ from 'lodash';
import * as mime from 'mime-types';
import * as path from 'path';

import {
	getLastFileExtension,
	getPenultimateFileExtension,
} from './file-extensions';

export function getCompressedExtensions(): string[] {
	const result = [];
	for (const [
		mimetype,
		cls,
		// @ts-ignore (mimetypes is private)
	] of sdk.sourceDestination.SourceDestination.mimetypes.entries()) {
		if (cls.prototype instanceof sdk.sourceDestination.CompressedSource) {
			const extension = mime.extension(mimetype);
			if (extension) {
				result.push(extension);
			}
		}
	}
	return result;
}

export function getNonCompressedExtensions(): string[] {
	return sdk.sourceDestination.SourceDestination.imageExtensions;
}

export function getArchiveExtensions(): string[] {
	return ['zip', 'etch'];
}

export function getAllExtensions(): string[] {
	return [
		...getArchiveExtensions(),
		...getNonCompressedExtensions(),
		...getCompressedExtensions(),
	];
}

export function isSupportedImage(imagePath: string): boolean {
	const lastExtension = getLastFileExtension(imagePath);
	const penultimateExtension = getPenultimateFileExtension(imagePath);

	if (
		_.some([
			_.includes(getNonCompressedExtensions(), lastExtension),
			_.includes(getArchiveExtensions(), lastExtension),
		])
	) {
		return true;
	}

	if (
		_.every([
			_.includes(getCompressedExtensions(), lastExtension),
			_.includes(getNonCompressedExtensions(), penultimateExtension),
		])
	) {
		return true;
	}

	return (
		_.isNil(penultimateExtension) &&
		_.includes(getCompressedExtensions(), lastExtension)
	);
}

export function looksLikeWindowsImage(imagePath: string): boolean {
	const regex = /windows|win7|win8|win10|winxp/i;
	return regex.test(path.basename(imagePath));
}
