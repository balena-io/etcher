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
import { bytesToMegabytes, formatSeconds } from '../../lib/shared/units';

describe('Shared: Units', function () {
	describe('.bytesToMegabytes()', function () {
		it('should convert bytes to megabytes', function () {
			expect(bytesToMegabytes(1.2e7)).to.equal(12);
			expect(bytesToMegabytes(332000)).to.equal(0.332);
		});
	});

	describe('.formatSeconds()', function () {
		it('should format seconds as minutes and seconds', function () {
			expect(formatSeconds(0)).to.equal('0m0s');
			expect(formatSeconds(59)).to.equal('0m59s');
			expect(formatSeconds(83)).to.equal('1m23s');
			expect(formatSeconds(3725)).to.equal('62m5s');
		});

		it('should floor fractional seconds', function () {
			expect(formatSeconds(83.9)).to.equal('1m23s');
		});

		it('should return an empty string for non-finite values', function () {
			expect(formatSeconds(NaN)).to.equal('');
			expect(formatSeconds(Infinity)).to.equal('');
		});
	});
});
