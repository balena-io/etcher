/*
 * Copyright 2020 balena.io
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

/**
 * @summary Truncate text from the start with an ellipsis
 */
export function startEllipsis(input: string, limit: number): string {
	// Do nothing, the string doesn't need truncation.
	if (input.length <= limit) {
		return input;
	}

	const lastPart = input.slice(input.length - limit, input.length);
	return `…${lastPart}`;
}
