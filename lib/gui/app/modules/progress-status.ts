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
import * as settings from '../models/settings';

export interface FlashState {
	flashing: number;
	verifying: number;
	successful: number;
	failed: number;
	percentage?: number;
	speed: number;
	position: number;
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
 *   flashing: 1,
 *   verifying: 0,
 *   successful: 0,
 *   failed: 0,
 *   percentage: 55,
 *   speed: 2049
 * })
 *
 * console.log(status)
 * // '55% Flashing'
 */
export function fromFlashState(state: FlashState): string {
	const isFlashing = Boolean(state.flashing);
	const isValidating = !isFlashing && Boolean(state.verifying);
	const shouldValidate = settings.get('validateWriteOnSuccess');
	const shouldUnmount = settings.get('unmountOnSuccess');

	if (state.percentage === 0 && !state.speed) {
		if (isValidating) {
			return 'Validating...';
		}

		return 'Starting...';
	} else if (state.percentage === 100) {
		if ((isValidating || !shouldValidate) && shouldUnmount) {
			return 'Unmounting...';
		}

		return 'Finishing...';
	} else if (isFlashing) {
		if (state.percentage != null) {
			return `${state.percentage}% Flashing`;
		}
		return `${bytesToClosestUnit(state.position)} flashed`;
	} else if (isValidating) {
		return `${state.percentage}% Validating`;
	} else if (!isFlashing && !isValidating) {
		return 'Failed';
	}

	throw new Error(`Invalid state: ${JSON.stringify(state)}`);
}
