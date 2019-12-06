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
require('angular-mocks')

describe('Browser: Modal', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/app/components/modal/modal')
  ))

  describe('ModalService', function () {
    let ModalService

    beforeEach(angular.mock.inject(function (_ModalService_) {
      ModalService = _ModalService_
    }))

    describe('.open()', function () {
      it('should not emit any errors when the template is a non-empty string', function () {
        m.chai.expect(function () {
          ModalService.open({
            template: '<div>{{ \'Hello\' }}, World!</div>'
          })
        }).to.not.throw()
      })

      it('should emit error on no template field', function () {
        m.chai.expect(function () {
          ModalService.open({})
        }).to.throw('One of component or template or templateUrl options is required.')
      })

      it('should emit error on empty string template', function () {
        m.chai.expect(function () {
          ModalService.open({
            template: ''
          })
        }).to.throw('One of component or template or templateUrl options is required.')
      })
    })
  })
})
