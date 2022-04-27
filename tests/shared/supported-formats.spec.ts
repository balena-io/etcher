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

import { expect } from 'chai';
import * as _ from 'lodash';

import * as supportedFormats from '../../lib/shared/supported-formats';

describe('Shared: SupportedFormats', function () {
	describe('.looksLikeWindowsImage()', function () {
		_.each(
			[
				'C:\\path\\to\\en_windows_10_multiple_editions_version_1607_updated_jan_2017_x64_dvd_9714399.iso',
				'/path/to/en_windows_10_multiple_editions_version_1607_updated_jan_2017_x64_dvd_9714399.iso',
				'/path/to/Win10_1607_SingleLang_English_x32.iso',
				'/path/to/en_winxp_pro_x86_build2600_iso.img',
			],
			(imagePath) => {
				it(`should return true if filename is ${imagePath}`, function () {
					const looksLikeWindowsImage =
						supportedFormats.looksLikeWindowsImage(imagePath);
					expect(looksLikeWindowsImage).to.be.true;
				});
			},
		);

		_.each(
			[
				'C:\\path\\to\\2017-01-11-raspbian-jessie.img',
				'/path/to/2017-01-11-raspbian-jessie.img',
			],
			(imagePath) => {
				it(`should return false if filename is ${imagePath}`, function () {
					const looksLikeWindowsImage =
						supportedFormats.looksLikeWindowsImage(imagePath);
					expect(looksLikeWindowsImage).to.be.false;
				});
			},
		);
	});
});
