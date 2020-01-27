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

import * as _ from 'lodash';
import * as prettyBytes from 'pretty-bytes';

const MEGABYTE_TO_BYTE_RATIO = 1000000;
const MILLISECONDS_IN_A_DAY = 86400000;

export function bytesToMegabytes(bytes: number): number {
	return bytes / MEGABYTE_TO_BYTE_RATIO;
}

export function bytesToClosestUnit(bytes: number): string | null {
	if (_.isNumber(bytes)) {
		return prettyBytes(bytes);
	}
	return null;
}

export function daysToMilliseconds(days: number): number {
	return days * MILLISECONDS_IN_A_DAY;
}
