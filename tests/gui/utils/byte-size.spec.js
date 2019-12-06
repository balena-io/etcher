/*
 * Copyright 2017 balena.io
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
const angular = require('angular')
const units = require('../../../lib/shared/units')

describe('Browser: ByteSize', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/app/utils/byte-size/byte-size')
  ))

  describe('ClosestUnitFilter', function () {
    let closestUnitFilter

    beforeEach(angular.mock.inject(function (_closestUnitFilter_) {
      closestUnitFilter = _closestUnitFilter_
    }))

    it('should expose lib/shared/units.js bytesToGigabytes()', function () {
      m.chai.expect(closestUnitFilter).to.equal(units.bytesToClosestUnit)
    })
  })
})
