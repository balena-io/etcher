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

import { bytesToMegabytes } from '../../../shared/units';
import { Actions, store } from './store';

/**
 * @summary Reset flash state
 */
export function resetState() {
	store.dispatch({
		type: Actions.RESET_FLASH_STATE,
	});
}

/**
 * @summary Check if currently flashing
 */
export function isFlashing(): boolean {
	return store.getState().toJS().isFlashing;
}

/**
 * @summary Set the flashing flag
 *
 * @description
 * The flag is used to signify that we're going to
 * start a flash process.
 */
export function setFlashingFlag() {
	store.dispatch({
		type: Actions.SET_FLASHING_FLAG,
	});
}

/**
 * @summary Unset the flashing flag
 *
 * @description
 * The flag is used to signify that the write process ended.
 */
export function unsetFlashingFlag(results: {
	cancelled: boolean;
	sourceChecksum?: number;
}) {
	store.dispatch({
		type: Actions.UNSET_FLASHING_FLAG,
		data: results,
	});
}

/**
 * @summary Set the flashing state
 */
export function setProgressState(
	state: sdk.multiWrite.MultiDestinationProgress,
) {
	// Preserve only one decimal place
	const PRECISION = 1;
	const data = _.assign({}, state, {
		percentage:
			state.percentage !== undefined && _.isFinite(state.percentage)
				? Math.floor(state.percentage)
				: undefined,

		speed: _.attempt(() => {
			if (_.isFinite(state.speed)) {
				return _.round(bytesToMegabytes(state.speed), PRECISION);
			}

			return null;
		}),

		totalSpeed: _.attempt(() => {
			if (_.isFinite(state.totalSpeed)) {
				return _.round(bytesToMegabytes(state.totalSpeed), PRECISION);
			}

			return null;
		}),
	});

	store.dispatch({
		type: Actions.SET_FLASH_STATE,
		data,
	});
}

export function getFlashResults() {
	return store.getState().toJS().flashResults;
}

export function getFlashState() {
	return store
		.getState()
		.get('flashState')
		.toJS();
}

export function wasLastFlashCancelled() {
	return _.get(exports.getFlashResults(), ['cancelled'], false);
}

export function getLastFlashSourceChecksum(): string {
	return exports.getFlashResults().sourceChecksum;
}

export function getLastFlashErrorCode() {
	return exports.getFlashResults().errorCode;
}

export function getFlashUuid() {
	return store.getState().toJS().flashUuid;
}
