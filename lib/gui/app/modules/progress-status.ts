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

import * as prettyBytes from 'pretty-bytes';
import * as i18next from 'i18next';

export interface FlashState {
	active: number;
	failed: number;
	percentage?: number;
	speed: number;
	position: number;
	type?: 'decompressing' | 'flashing' | 'verifying';
}

export function fromFlashState({
	type,
	percentage,
	position,
}: Pick<FlashState, 'type' | 'percentage' | 'position'>): {
	status: string;
	position?: string;
} {
	console.log(i18next.t('progress.starting'));

	if (type === undefined) {
		return { status: i18next.t('progress.starting') };
	} else if (type === 'decompressing') {
		if (percentage == null) {
			return { status: i18next.t('progress.decompressing') };
		} else {
			return {
				position: `${percentage}%`,
				status: i18next.t('progress.decompressing'),
			};
		}
	} else if (type === 'flashing') {
		if (percentage != null) {
			if (percentage < 100) {
				return {
					position: `${percentage}%`,
					status: i18next.t('progress.flashing'),
				};
			} else {
				return { status: i18next.t('progress.finishing') };
			}
		} else {
			return {
				status: i18next.t('progress.flashing'),
				position: `${position ? prettyBytes(position) : ''}`,
			};
		}
	} else if (type === 'verifying') {
		if (percentage == null) {
			return { status: i18next.t('progress.verifying') };
		} else if (percentage < 100) {
			return {
				position: `${percentage}%`,
				status: i18next.t('progress.verifying'),
			};
		} else {
			return { status: i18next.t('progress.finishing') };
		}
	}
	return { status: i18next.t('progress.failing') };
}

export function titleFromFlashState(
	state: Pick<FlashState, 'type' | 'percentage' | 'position'>,
): string {
	const { status, position } = fromFlashState(state);
	if (position !== undefined) {
		return `${position} ${status}`;
	}
	return status;
}
