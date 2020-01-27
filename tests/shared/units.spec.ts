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
import * as units from '../../lib/shared/units';

describe('Shared: Units', function() {
	describe('.bytesToClosestUnit()', function() {
		it('should convert bytes to terabytes', function() {
			expect(units.bytesToClosestUnit(1000000000000)).to.equal('1 TB');
			expect(units.bytesToClosestUnit(2987801405440)).to.equal('2.99 TB');
			expect(units.bytesToClosestUnit(999900000000000)).to.equal('1000 TB');
		});

		it('should convert bytes to gigabytes', function() {
			expect(units.bytesToClosestUnit(1000000000)).to.equal('1 GB');
			expect(units.bytesToClosestUnit(7801405440)).to.equal('7.8 GB');
			expect(units.bytesToClosestUnit(999900000000)).to.equal('1000 GB');
		});

		it('should convert bytes to megabytes', function() {
			expect(units.bytesToClosestUnit(1000000)).to.equal('1 MB');
			expect(units.bytesToClosestUnit(801405440)).to.equal('801 MB');
			expect(units.bytesToClosestUnit(999900000)).to.equal('1000 MB');
		});

		it('should convert bytes to kilobytes', function() {
			expect(units.bytesToClosestUnit(1000)).to.equal('1 kB');
			expect(units.bytesToClosestUnit(5440)).to.equal('5.44 kB');
			expect(units.bytesToClosestUnit(999900)).to.equal('1000 kB');
		});

		it('should keep bytes as bytes', function() {
			expect(units.bytesToClosestUnit(1)).to.equal('1 B');
			expect(units.bytesToClosestUnit(8)).to.equal('8 B');
			expect(units.bytesToClosestUnit(999)).to.equal('999 B');
		});
	});

	describe('.bytesToMegabytes()', function() {
		it('should convert bytes to megabytes', function() {
			expect(units.bytesToMegabytes(1.2e7)).to.equal(12);
			expect(units.bytesToMegabytes(332000)).to.equal(0.332);
		});
	});
});
