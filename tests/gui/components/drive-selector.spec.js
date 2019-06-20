/*
 * Copyright 2017 resin.io
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
const angular = require('angular')
require('angular-mocks')
// eslint-disable-next-line node/no-missing-require
const utils = require('../../../lib/gui/app/modules/utils')

describe('Browser: DriveSelector', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/app/components/drive-selector/drive-selector')
  ))

  describe('DriveSelectorController', function () {
    describe('.memoize()', function () {
      it('should handle equal angular objects with different hashes', function () {
        const memoizedParameter = utils.memoize(_.identity, angular.equals)
        const angularObjectA = {
          $$hashKey: 1,
          keyA: true
        }
        const angularObjectB = {
          $$hashKey: 2,
          keyA: true
        }

        m.chai.expect(memoizedParameter(angularObjectA)).to.equal(angularObjectA)
        m.chai.expect(memoizedParameter(angularObjectB)).to.equal(angularObjectA)
      })
    })
  })
})
