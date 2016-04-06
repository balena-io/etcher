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
const os = require('os');
const angular = require('angular');
const electron = require('electron');
const shell = electron.remote.require('shell');
require('angular-mocks');
require('../../../lib/browser/utils/open-external/open-external');

describe('Browser: OpenExternal', function() {

  beforeEach(angular.mock.module('Etcher.Utils.OpenExternal'));

  describe('openExternal', function() {

    let $compile;
    let $rootScope;

    beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    }));

    it('should set the element cursor to pointer', function() {
      const element = $compile('<span open-external="https://resin.io">Resin.io</span>')($rootScope);
      $rootScope.$digest();
      m.chai.expect(element.css('cursor')).to.equal('pointer');
    });

    describe('given non linux', function() {

      beforeEach(function() {
        this.osPlatformStub = m.sinon.stub(os, 'platform');
        this.osPlatformStub.returns('darwin');
      });

      afterEach(function() {
        this.osPlatformStub.restore();
      });

      it('should call Electron shell.openExternal with the attribute value', function() {
        const shellExternalStub = m.sinon.stub(shell, 'openExternal');
        const element = $compile('<span open-external="https://resin.io">Resin.io</span>')($rootScope);
        element.triggerHandler('click');
        $rootScope.$digest();
        m.chai.expect(shellExternalStub).to.have.been.calledWith('https://resin.io');
        shellExternalStub.restore();
      });

    });

  });

});
