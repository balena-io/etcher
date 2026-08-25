/*
 * Copyright 2026 balena.io
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

import * as fs from 'fs';
import * as path from 'path';

/**
 * The GitHub repository releases are published to and updates are pulled
 * from. This is a fork, so it deliberately does not point at balena's
 * upstream releases — a build from here must never replace itself with one
 * from a different project.
 */
export const UPDATE_REPOSITORY = 'guitar24t/etcher';

/**
 * @summary Whether this build can update itself in place.
 *
 * electron-forge produces Squirrel artifacts, so Squirrel is the only
 * updater in play:
 *
 * - Windows: Squirrel.Windows, and only for an app installed by Setup.exe.
 *   An extracted .zip has no Update.exe beside it, and Electron's autoUpdater
 *   throws outright when it is missing.
 * - macOS: Squirrel.Mac, which requires the bundle to carry a valid Developer
 *   ID signature. Ad-hoc signed builds — everything produced without signing
 *   credentials — cannot update, and fail at the point of checking. That
 *   cannot be detected cheaply here, so it is left to surface as a logged
 *   updater error rather than being guessed at.
 * - Linux: .deb and .rpm are the package manager's business, and the .zip has
 *   no updater at all.
 */
export function isUpdateSupported(): boolean {
	if (process.platform === 'darwin') {
		return true;
	}
	if (process.platform === 'win32') {
		return hasSquirrelInstall();
	}
	return false;
}

/**
 * @summary Whether the app was installed by Squirrel.
 *
 * Squirrel lays out an installation as `<root>/app-<version>/<exe>` with
 * `Update.exe` sitting in `<root>`.
 */
function hasSquirrelInstall(): boolean {
	try {
		return fs.existsSync(
			path.join(path.dirname(process.execPath), '..', 'Update.exe'),
		);
	} catch {
		return false;
	}
}
