/*
 * Copyright 2017 balena.io
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

import { bytesToClosestUnit } from '../../../shared/units';
import { ProgressButtonProps } from '../components/progress-button/progress-button';

export interface FlashState {
	active: number;
	failed: number;
	percentage?: number;
	speed: number;
	position: number;
	type?: 'decompressing' | 'flashing' | 'verifying';
}

export interface ProgressStatusType {
	status: ProgressButtonProps['label']['status'];
	percentage?: number | string;
}

/**
 * @summary Make the progress status subtitle string
 *
 * @param {Object} state - flashing metadata
 *
 * @returns {String}
 *
 * @example
 * const status = progressStatus.fromFlashState({
 *   type: 'flashing'
 *   active: 1,
 *   failed: 0,
 *   percentage: 55,
 *   speed: 2049,
 * })
 *
 * console.log(status)
 * // '55% Flashing'
 */
export function fromFlashState({
	type,
	percentage,
	position,
}: FlashState): ProgressStatusType {
	if (type === undefined) {
		return { status: 'starting' };
	} else if (type === 'decompressing') {
		if (percentage == null) {
			return { status: 'decompressing' };
		} else {
			return { status: 'decompressing', percentage };
		}
	} else if (type === 'flashing') {
		if (percentage != null) {
			if (percentage < 100) {
				return { status: 'flashing', percentage };
			} else {
				return { status: 'finishing' };
			}
		} else {
			return { status: 'flashed', percentage: bytesToClosestUnit(position) };
		}
	} else if (type === 'verifying') {
		if (percentage == null) {
			return { status: 'validating' };
		} else if (percentage < 100) {
			return { status: 'validating', percentage };
		} else {
			return { status: 'finishing' };
		}
	}
	return { status: 'failed' };
}
