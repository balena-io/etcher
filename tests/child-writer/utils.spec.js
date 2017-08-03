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
const utils = require('../../lib/child-writer/utils')

describe('ChildWriter Utils', function () {
  describe('.splitObjectLines()', function () {
    it('should split multiple object lines', function () {
      const input = '{"id":"foo"}\n{"id":"bar"}\n{"id":"baz"}'
      m.chai.expect(utils.splitObjectLines(input)).to.deep.equal([
        '{"id":"foo"}',
        '{"id":"bar"}',
        '{"id":"baz"}'
      ])
    })

    it('should ignore spaces in between', function () {
      const input = '{"id":"foo"}   \n     {"id":"bar"}\n   {"id":"baz"}'
      m.chai.expect(utils.splitObjectLines(input)).to.deep.equal([
        '{"id":"foo"}',
        '{"id":"bar"}',
        '{"id":"baz"}'
      ])
    })

    it('should ignore multiple new lines', function () {
      const input = '{"id":"foo"}\n\n\n\n{"id":"bar"}\n\n{"id":"baz"}'
      m.chai.expect(utils.splitObjectLines(input)).to.deep.equal([
        '{"id":"foo"}',
        '{"id":"bar"}',
        '{"id":"baz"}'
      ])
    })

    it('should ignore new lines inside properties', function () {
      const input = '{"id":"foo\nbar"}\n{"id":"\nhello\n"}'
      m.chai.expect(utils.splitObjectLines(input)).to.deep.equal([
        '{"id":"foo\nbar"}',
        '{"id":"\nhello\n"}'
      ])
    })

    it('should handle carriage returns', function () {
      const input = '{"id":"foo"}\r\n{"id":"bar"}\r\n{"id":"baz"}'
      m.chai.expect(utils.splitObjectLines(input)).to.deep.equal([
        '{"id":"foo"}',
        '{"id":"bar"}',
        '{"id":"baz"}'
      ])
    })

    it('should ignore multiple carriage returns', function () {
      const input = '{"id":"foo"}\r\n\r\n{"id":"bar"}\r\n\r\n\r\n{"id":"baz"}'
      m.chai.expect(utils.splitObjectLines(input)).to.deep.equal([
        '{"id":"foo"}',
        '{"id":"bar"}',
        '{"id":"baz"}'
      ])
    })
  })
})
