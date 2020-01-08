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
// eslint-disable-next-line node/no-missing-require
const utils = require('../../lib/shared/utils')

describe('Shared: Utils', function () {
  describe('.isValidPercentage()', function () {
    it('should return false if percentage is not a number', function () {
      m.chai.expect(utils.isValidPercentage('50')).to.be.false
    })

    it('should return false if percentage is null', function () {
      m.chai.expect(utils.isValidPercentage(null)).to.be.false
    })

    it('should return false if percentage is undefined', function () {
      m.chai.expect(utils.isValidPercentage(undefined)).to.be.false
    })

    it('should return false if percentage is an integer less than 0', function () {
      m.chai.expect(utils.isValidPercentage(-1)).to.be.false
    })

    it('should return false if percentage is a float less than 0', function () {
      m.chai.expect(utils.isValidPercentage(-0.1)).to.be.false
    })

    it('should return true if percentage is 0', function () {
      m.chai.expect(utils.isValidPercentage(0)).to.be.true
    })

    it('should return true if percentage is an integer greater than 0, but less than 100', function () {
      m.chai.expect(utils.isValidPercentage(50)).to.be.true
    })

    it('should return true if percentage is a float greater than 0, but less than 100', function () {
      m.chai.expect(utils.isValidPercentage(49.55)).to.be.true
    })

    it('should return true if percentage is 100', function () {
      m.chai.expect(utils.isValidPercentage(100)).to.be.true
    })

    it('should return false if percentage is an integer greater than 100', function () {
      m.chai.expect(utils.isValidPercentage(101)).to.be.false
    })

    it('should return false if percentage is a float greater than 100', function () {
      m.chai.expect(utils.isValidPercentage(100.001)).to.be.false
    })
  })

  describe('.percentageToFloat()', function () {
    it('should throw an error if given a string percentage', function () {
      m.chai.expect(function () {
        utils.percentageToFloat('50')
      }).to.throw('Invalid percentage: 50')
    })

    it('should throw an error if given a null percentage', function () {
      m.chai.expect(function () {
        utils.percentageToFloat(null)
      }).to.throw('Invalid percentage: null')
    })

    it('should throw an error if given an undefined percentage', function () {
      m.chai.expect(function () {
        utils.percentageToFloat(undefined)
      }).to.throw('Invalid percentage: undefined')
    })

    it('should throw an error if given an integer percentage < 0', function () {
      m.chai.expect(function () {
        utils.percentageToFloat(-1)
      }).to.throw('Invalid percentage: -1')
    })

    it('should throw an error if given a float percentage < 0', function () {
      m.chai.expect(function () {
        utils.percentageToFloat(-0.1)
      }).to.throw('Invalid percentage: -0.1')
    })

    it('should covert a 0 percentage to 0', function () {
      m.chai.expect(utils.percentageToFloat(0)).to.equal(0)
    })

    it('should covert an integer percentage to a float', function () {
      m.chai.expect(utils.percentageToFloat(50)).to.equal(0.5)
    })

    it('should covert an float percentage to a float', function () {
      m.chai.expect(utils.percentageToFloat(46.54)).to.equal(0.4654)
    })

    it('should covert a 100 percentage to 1', function () {
      m.chai.expect(utils.percentageToFloat(100)).to.equal(1)
    })

    it('should throw an error if given an integer percentage > 100', function () {
      m.chai.expect(function () {
        utils.percentageToFloat(101)
      }).to.throw('Invalid percentage: 101')
    })

    it('should throw an error if given a float percentage > 100', function () {
      m.chai.expect(function () {
        utils.percentageToFloat(100.01)
      }).to.throw('Invalid percentage: 100.01')
    })
  })
})
