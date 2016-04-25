/*
 * Copyright 2016 Resin.io
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
const angular = require('angular');
require('angular-mocks');

describe('Browser: IfState', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/utils/if-state/if-state')
  ));

  let $compile;
  let $rootScope;
  let $state;

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _$state_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $state = _$state_;
  }));

  describe('given the current state is "foo"', function() {

    beforeEach(function() {
      this.stateIsStub = m.sinon.stub($state, 'is');
      this.stateIsStub.withArgs('foo').returns(true);
      this.stateIsStub.returns(false);
    });

    afterEach(function() {
      this.stateIsStub.restore();
    });

    describe('hideIfState', function() {

      it('should hide the element if the attribute equals "foo"', function() {
        const element = $compile('<span hide-if-state="foo">Resin.io</span>')($rootScope);
        $rootScope.$digest();
        m.chai.expect(element.css('display')).to.equal('none');
      });

      it('should show the element if the attribute does not equal "foo"', function() {
        const element = $compile('<span hide-if-state="bar">Resin.io</span>')($rootScope);
        $rootScope.$digest();
        m.chai.expect(element.css('display')).to.equal('initial');
      });

      it('should show the element if the state changes', function() {
        const element = $compile('<span hide-if-state="foo">Resin.io</span>')($rootScope);
        $rootScope.$digest();
        m.chai.expect(element.css('display')).to.equal('none');
        this.stateIsStub.withArgs('foo').returns(false);
        $rootScope.$digest();
        m.chai.expect(element.css('display')).to.equal('initial');
      });

    });

    describe('showIfState', function() {

      it('should hide the element if the attribute does not equal "foo"', function() {
        const element = $compile('<span show-if-state="bar">Resin.io</span>')($rootScope);
        $rootScope.$digest();
        m.chai.expect(element.css('display')).to.equal('none');
      });

      it('should show the element if the attribute equals "foo"', function() {
        const element = $compile('<span show-if-state="foo">Resin.io</span>')($rootScope);
        $rootScope.$digest();
        m.chai.expect(element.css('display')).to.equal('initial');
      });

      it('should hide the element if the state changes', function() {
        const element = $compile('<span show-if-state="foo">Resin.io</span>')($rootScope);
        $rootScope.$digest();
        m.chai.expect(element.css('display')).to.equal('initial');
        this.stateIsStub.withArgs('foo').returns(false);
        $rootScope.$digest();
        m.chai.expect(element.css('display')).to.equal('none');
      });

    });

  });

});
