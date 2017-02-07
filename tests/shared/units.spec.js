/*
 * Copyright 2016 resin.io
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

'use strict';

const m = require('mochainon');
const units = require('../../lib/shared/units');

describe('Shared: Units', function() {

  describe('.bytesToGigabytes()', function() {

    it('should convert bytes to gigabytes', function() {
      m.chai.expect(units.bytesToGigabytes(7801405440)).to.equal(7.80140544);
      m.chai.expect(units.bytesToGigabytes(100000000)).to.equal(0.1);
    });

    it('should convert bytes to megabytes', function() {
      m.chai.expect(units.bytesToMegabytes(1.2e+7)).to.equal(12);
      m.chai.expect(units.bytesToMegabytes(332000)).to.equal(0.332);
    });

  });

});
