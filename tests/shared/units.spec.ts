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
import { bytesToMegabytes } from '../../lib/shared/units';

describe('Shared: Units', function () {
	describe('.bytesToMegabytes()', function () {
		it('should convert bytes to megabytes', function () {
			expect(bytesToMegabytes(1.2e7)).to.equal(12);
			expect(bytesToMegabytes(332000)).to.equal(0.332);
		});
	});
});
