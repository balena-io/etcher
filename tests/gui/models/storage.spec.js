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

const _ = require('lodash')
const m = require('mochainon')
const Storage = require('../../../lib/gui/app/models/storage')

describe('Browser: storage', function () {
  beforeEach(function () {
    this.testStorage = new Storage('test')

    this.superObject = {
      fieldA: 1,
      fieldB: 2
    }

    this.testStorage.setAll(this.superObject)
  })

  afterEach(function () {
    this.testStorage.clearAll()
  })

  describe('.getAll()', function () {
    it('should return the super-object', function () {
      m.chai.expect(this.testStorage.getAll()).to.deep.equal(this.superObject)
    })
  })

  describe('.setAll()', function () {
    it('should set the super-object', function () {
      const superObject = { fieldC: 3, fieldD: 4 }
      this.testStorage.setAll(superObject)
      m.chai.expect(this.testStorage.getAll()).to.deep.equal(superObject)
    })
  })

  describe('.clearAll()', function () {
    it('should remove the super-object', function () {
      this.testStorage.clearAll()
      m.chai.expect(this.testStorage.getAll()).to.deep.equal({})
    })
  })

  describe('.get()', function () {
    it('should retrieve the value', function () {
      m.chai.expect(this.testStorage.get('fieldA')).to.equal(1)
    })
  })

  describe('.modify()', function () {
    it('should change the value', function () {
      this.testStorage.modify('fieldA', (fieldA) => {
        return fieldA + 1
      })
      m.chai.expect(this.testStorage.get('fieldA')).to.equal(2)
    })

    it('should return a value', function () {
      const value = this.testStorage.modify('fieldA', (fieldA) => {
        return fieldA + 1
      })
      m.chai.expect(value).to.equal(2)
    })

    it('should use the fallback default value if field doesn\'t exist', function () {
      const FALLBACK = 1.5
      m.chai.expect(this.testStorage.modify('fieldC', _.ceil, FALLBACK)).to.equal(2)
    })

    it('should be undefined if no fallback default value is given', function () {
      m.chai.expect(this.testStorage.modify('fieldC', _.identity)).to.be.undefined
    })
  })

  describe('.set()', function () {
    it('should set a value', function () {
      this.testStorage.set('fieldC', 3)
      m.chai.expect(this.testStorage.get('fieldC')).to.equal(3)
    })
  })
})
