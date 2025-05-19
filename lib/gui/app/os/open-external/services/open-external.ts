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
import * as settings from '../../../models/settings';

/**
 * @summary Open an external resource
 */
export async function open(url: string) {
	// Don't open links if they're disabled by the env var
	if (await settings.get('disableExternalLinks')) {
		return;
	}

	if (url) {
		electron.shell.openExternal(url);
	}
}
