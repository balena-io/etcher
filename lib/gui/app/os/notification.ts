/*
 * Copyright 2017 balena.io
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

import * as settings from '../models/settings';

/**
 * @summary Send a notification
 */
export async function send(title: string, body: string, icon: string) {
	// Bail out if desktop notifications are disabled
	if (!(await settings.get('desktopNotifications'))) {
		return;
	}

	// `app.dock` is only defined in OS X
	if (electron.remote.app.dock) {
		electron.remote.app.dock.bounce();
	}

	return new window.Notification(title, { body, icon });
}
