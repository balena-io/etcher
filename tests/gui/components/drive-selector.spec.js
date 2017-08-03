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

describe('Browser: DriveSelector', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/components/drive-selector/drive-selector')
  ))

  describe('DriveSelectorController', function () {
    let $controller
    let $rootScope
    let $q
    let $uibModalInstance
    let WarningModalService

    let controller

    beforeEach(angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _WarningModalService_
    ) {
      $controller = _$controller_
      $rootScope = _$rootScope_
      $q = _$q_
      $uibModalInstance = {}
      WarningModalService = _WarningModalService_
    }))

    beforeEach(() => {
      controller = $controller('DriveSelectorController', {
        $scope: $rootScope.$new(),
        $q,
        $uibModalInstance,
        WarningModalService
      })
    })

    describe('.memoizeImmutableListReference()', function () {
      it('constant true should return memoized true', function () {
        const memoizedConstTrue = controller.memoizeImmutableListReference(_.constant(true))
        m.chai.expect(memoizedConstTrue()).to.be.true
      })

      it('should reflect state changes', function () {
        let stateA = false
        const memoizedStateA = controller.memoizeImmutableListReference(() => {
          return stateA
        })

        m.chai.expect(memoizedStateA()).to.be.false

        stateA = true

        m.chai.expect(memoizedStateA()).to.be.true
      })

      it('should reflect different arguments', function () {
        const memoizedParameter = controller.memoizeImmutableListReference(_.identity)

        m.chai.expect(memoizedParameter(false)).to.be.false
        m.chai.expect(memoizedParameter(true)).to.be.true
      })

      it('should handle equal angular objects with different hashes', function () {
        const memoizedParameter = controller.memoizeImmutableListReference(_.identity)
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
