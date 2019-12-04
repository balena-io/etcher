/*
 * Copyright 2016 resin.io
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

import { getDescription, getTitle } from '../../../shared/errors';
import { getAllExtensions } from '../../../shared/supported-formats';

export async function selectImage(): Promise<string | undefined> {
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
				name: 'OS Images',
				extensions: [...getAllExtensions()].sort(),
			},
		],
	};
	const currentWindow = electron.remote.getCurrentWindow();
	const [file] = (await electron.remote.dialog.showOpenDialog(
		currentWindow,
		options,
	)).filePaths;
	return file;
}

export interface ShowWarningOptions {
	title: string;
	description: string;
	confirmationLabel?: string;
	rejectionLabel?: string;
}

export async function showWarning(
	options: ShowWarningOptions,
): Promise<boolean> {
	const result = await electron.remote.dialog.showMessageBox(
		electron.remote.getCurrentWindow(),
		{
			type: 'warning',
			buttons: [
				// TODO: replace || with ?? whan it is supported by the linter
				options.confirmationLabel || 'OK',
				options.rejectionLabel || 'Cancel',
			],
			defaultId: 0,
			cancelId: 1,
			title: 'Attention',
			message: options.title,
			detail: options.description,
		},
	);
	return result.response === 0;
}

export function showError(error: Error) {
	const title = getTitle(error);
	const message = getDescription(error);
	electron.remote.dialog.showErrorBox(title, message);
}
