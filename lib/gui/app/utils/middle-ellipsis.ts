/*
 * Copyright 2016 Juan Cruz Viotti. https://github.com/jviotti
 * Copyright 2018 balena.io
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
 * @summary Truncate text from the middle with an ellipsis
 */
export function middleEllipsis(input: string, limit: number): string {
	// We can't provide a 100% expected result if the limit is less than 3. For example:
	//
	// If the limit == 2:
	//   Should we display the first at last character without an ellipses in the middle?
	//   Should we display just one character and an ellipses before or after?
	//   Should we display nothing at all?
	//
	// If the limit == 1:
	//   Should we display just one character?
	//   Should we display just an ellipses?
	//   Should we display nothing at all?
	//
	// Etc.
	if (limit < 3) {
		throw new Error('middleEllipsis: Limit should be at least 3');
	}

	// Do nothing, the string doesn't need truncation.
	if (input.length <= limit) {
		return input;
	}

	const lengthOfTheSidesAfterTruncation = Math.floor((limit - 1) / 2);
	const finalLeftPart = input.slice(0, lengthOfTheSidesAfterTruncation);
	const finalRightPart = input.slice(
		input.length - lengthOfTheSidesAfterTruncation,
	);

	return finalLeftPart + '…' + finalRightPart;
}
