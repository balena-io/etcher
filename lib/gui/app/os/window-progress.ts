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

import * as electron from 'electron';

import { percentageToFloat } from '../../../shared/utils';
import { FlashState, titleFromFlashState } from '../modules/progress-status';

/**
 * @summary The title of the main window upon program launch
 */
const INITIAL_TITLE = document.title;

/**
 * @summary Make the full window status title
 */
function getWindowTitle(state?: FlashState) {
	if (state) {
		return `${INITIAL_TITLE} – ${titleFromFlashState(state)}`;
	}
	return INITIAL_TITLE;
}

/**
 * @summary A reference to the current renderer Electron window
 *
 * @description
 * We expose this property to `this` for testability purposes.
 */
export const currentWindow = electron.remote.getCurrentWindow();

/**
 * @summary Set operating system window progress
 *
 * @description
 * Show progress inline in operating system task bar
 */
export function set(state: FlashState) {
	if (state.percentage != null) {
		exports.currentWindow.setProgressBar(percentageToFloat(state.percentage));
	}
	exports.currentWindow.setTitle(getWindowTitle(state));
}

/**
 * @summary Clear the window progress bar
 */
export function clear() {
	// Passing 0 or null/undefined doesn't work.
	exports.currentWindow.setProgressBar(-1);
	exports.currentWindow.setTitle(getWindowTitle(undefined));
}
