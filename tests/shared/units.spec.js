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

'use strict'

const m = require('mochainon')
const units = require('../../lib/shared/units')

describe('Shared: Units', function () {
  describe('.bytesToClosestUnit()', function () {
    it('should convert bytes to terabytes', function () {
      m.chai.expect(units.bytesToClosestUnit(1000000000000)).to.equal('1 TB')
      m.chai.expect(units.bytesToClosestUnit(2987801405440)).to.equal('2.99 TB')
      m.chai.expect(units.bytesToClosestUnit(999900000000000)).to.equal('999.9 TB')
    })

    it('should convert bytes to gigabytes', function () {
      m.chai.expect(units.bytesToClosestUnit(1000000000)).to.equal('1 GB')
      m.chai.expect(units.bytesToClosestUnit(7801405440)).to.equal('7.8 GB')
      m.chai.expect(units.bytesToClosestUnit(999900000000)).to.equal('999.9 GB')
    })

    it('should convert bytes to megabytes', function () {
      m.chai.expect(units.bytesToClosestUnit(1000000)).to.equal('1 MB')
      m.chai.expect(units.bytesToClosestUnit(801405440)).to.equal('801.41 MB')
      m.chai.expect(units.bytesToClosestUnit(999900000)).to.equal('999.9 MB')
    })

    it('should convert bytes to kilobytes', function () {
      m.chai.expect(units.bytesToClosestUnit(1000)).to.equal('1 kB')
      m.chai.expect(units.bytesToClosestUnit(5440)).to.equal('5.44 kB')
      m.chai.expect(units.bytesToClosestUnit(999900)).to.equal('999.9 kB')
    })

    it('should keep bytes as bytes', function () {
      m.chai.expect(units.bytesToClosestUnit(1)).to.equal('1 B')
      m.chai.expect(units.bytesToClosestUnit(8)).to.equal('8 B')
      m.chai.expect(units.bytesToClosestUnit(999)).to.equal('999 B')
    })
  })

  describe('.bytesToMegabytes()', function () {
    it('should convert bytes to megabytes', function () {
      m.chai.expect(units.bytesToMegabytes(1.2e+7)).to.equal(12)
      m.chai.expect(units.bytesToMegabytes(332000)).to.equal(0.332)
    })
  })
})
