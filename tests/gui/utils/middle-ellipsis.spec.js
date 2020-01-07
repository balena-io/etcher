
/*
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

'use strict'

const m = require('mochainon')
// eslint-disable-next-line node/no-missing-require
const { middleEllipsis } = require('../../../lib/gui/app/utils/middle-ellipsis')

describe('Browser: MiddleEllipsis', function () {
  describe('.middleEllipsis()', function () {
    it('should throw error if limit < 3', function () {
      m.chai.expect(() => {
        middleEllipsis('No', 2)
      }).to.throw('middleEllipsis: Limit should be at least 3')
    })

    describe('given the input length is greater than the limit', function () {
      it('should always truncate input to an odd length', function () {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'
        m.chai.expect(middleEllipsis(alphabet, 3)).to.have.a.lengthOf(3)
        m.chai.expect(middleEllipsis(alphabet, 4)).to.have.a.lengthOf(3)
        m.chai.expect(middleEllipsis(alphabet, 5)).to.have.a.lengthOf(5)
        m.chai.expect(middleEllipsis(alphabet, 6)).to.have.a.lengthOf(5)
      })
    })

    it('should return the input if it is within the bounds of limit', function () {
      m.chai.expect(middleEllipsis('Hello', 10)).to.equal('Hello')
    })
  })
})
