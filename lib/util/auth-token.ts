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

import { timingSafeEqual } from 'crypto';

/**
 * Check the auth token sent by the GUI against the one etcher-util was started with.
 * An empty or missing expected token always fails, so an unset ETCHER_SERVER_ID
 * can't be matched by an absent header.
 */
export function isValidToken(
	received: string | string[] | undefined,
	expected: string | undefined,
): boolean {
	if (typeof received !== 'string' || !expected) {
		return false;
	}
	const a = Buffer.from(received);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}
