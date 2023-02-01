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
import * as remote from '@electron/remote';
import * as _ from 'lodash';

import * as errors from '../../../shared/errors';
import * as settings from '../../../gui/app/models/settings';
import { SUPPORTED_EXTENSIONS } from '../../../shared/supported-formats';
import * as i18next from 'i18next';

async function mountSourceDrive() {
	// sourceDrivePath is the name of the link in /dev/disk/by-path
	const sourceDrivePath = await settings.get('automountOnFileSelect');
	if (sourceDrivePath) {
		try {
			await electron.ipcRenderer.invoke('mount-drive', sourceDrivePath);
		} catch (error: any) {
			// noop
		}
	}
}

/**
 * @summary Open an image selection dialog
 *
 * @description
 * Notice that by image, we mean *.img/*.iso/*.zip/etc files.
 */
export async function selectImage(): Promise<string | undefined> {
	await mountSourceDrive();
	const options: electron.OpenDialogOptions = {
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
				name: i18next.t('source.osImages'),
				extensions: SUPPORTED_EXTENSIONS,
			},
			{
				name: i18next.t('source.allFiles'),
				extensions: ['*'],
			},
		],
	};
	const currentWindow = remote.getCurrentWindow();
	const [file] = (await remote.dialog.showOpenDialog(currentWindow, options))
		.filePaths;
	return file;
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
		confirmationLabel: i18next.t('ok'),
		rejectionLabel: i18next.t('cancel'),
	});

	const BUTTONS = [options.confirmationLabel, options.rejectionLabel];

	const BUTTON_CONFIRMATION_INDEX = _.indexOf(
		BUTTONS,
		options.confirmationLabel,
	);
	const BUTTON_REJECTION_INDEX = _.indexOf(BUTTONS, options.rejectionLabel);

	const { response } = await remote.dialog.showMessageBox(
		remote.getCurrentWindow(),
		{
			type: 'warning',
			buttons: BUTTONS,
			defaultId: BUTTON_REJECTION_INDEX,
			cancelId: BUTTON_REJECTION_INDEX,
			title: i18next.t('attention'),
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
	remote.dialog.showErrorBox(title, message);
}
