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
import * as _ from 'lodash';

import * as errors from '../../../shared/errors';
import * as supportedFormats from '../../../shared/supported-formats';

/**
 * @summary Open an image selection dialog
 *
 * @description
 * Notice that by image, we mean *.img/*.iso/*.zip/etc files.
 */
export function selectImage(): Promise<string> {
	return new Promise(resolve => {
		electron.remote.dialog.showOpenDialog(
			electron.remote.getCurrentWindow(),
			{
				// This variable is set when running in GNU/Linux from
				// inside an AppImage, and represents the working directory
				// from where the AppImage was run (which might not be the
				// place where the AppImage is located). `OWD` stands for
				// "Original Working Directory".
				//
				// See: https://github.com/probonopd/AppImageKit/commit/1569d6f8540aa6c2c618dbdb5d6fcbf0003952b7
				defaultPath: process.env.OWD,
				properties: ['openFile', 'treatPackageAsDirectory'],
				filters: [
					{
						name: 'OS Images',
						extensions: _.sortBy(supportedFormats.getAllExtensions()),
					},
				],
			},
			(files: string[]) => {
				// `_.first` is smart enough to not throw and return `undefined`
				// if we pass it an `undefined` value (e.g: when the selection
				// dialog was cancelled).
				resolve(_.first(files));
			},
		);
	});
}

/**
 * @summary Open a warning dialog
 */
export async function showWarning(options: {
	confirmationLabel: string;
	rejectionLabel: string;
	title: string;
	description: string;
}): Promise<boolean> {
	_.defaults(options, {
		confirmationLabel: 'OK',
		rejectionLabel: 'Cancel',
	});

	const BUTTONS = [options.confirmationLabel, options.rejectionLabel];

	const BUTTON_CONFIRMATION_INDEX = _.indexOf(
		BUTTONS,
		options.confirmationLabel,
	);
	const BUTTON_REJECTION_INDEX = _.indexOf(BUTTONS, options.rejectionLabel);

	const { response } = await electron.remote.dialog.showMessageBox(
		electron.remote.getCurrentWindow(),
		{
			type: 'warning',
			buttons: BUTTONS,
			defaultId: BUTTON_REJECTION_INDEX,
			cancelId: BUTTON_REJECTION_INDEX,
			title: 'Attention',
			message: options.title,
			detail: options.description,
		},
	);
	return response === BUTTON_CONFIRMATION_INDEX;
}

/**
 * @summary Show error dialog for an Error instance
 */
export function showError(error: Error) {
	const title = errors.getTitle(error);
	const message = errors.getDescription(error);
	electron.remote.dialog.showErrorBox(title, message);
}
