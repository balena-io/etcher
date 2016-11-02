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

'use strict';

const m = require('mochainon');
const angular = require('angular');
const packageJSON = require('../../../package.json');
require('angular-mocks');

describe('Browser: ManifestBind', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/utils/manifest-bind/manifest-bind')
  ));

  let $compile;
  let $rootScope;

  beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  describe('ManifestBindService', function() {

    let ManifestBindService;

    beforeEach(angular.mock.inject(function(_ManifestBindService_) {
      ManifestBindService = _ManifestBindService_;
    }));

    it('should be able to fetch top level properties', function() {
      const value = ManifestBindService.get('version');
      m.chai.expect(value).to.equal(packageJSON.version);
    });

    it('should be able to fetch nested properties', function() {
      const value = ManifestBindService.get('repository.type');
      m.chai.expect(value).to.equal(packageJSON.repository.type);
    });

    it('should return undefined if the property does not exist', function() {
      const value = ManifestBindService.get('foo.bar');
      m.chai.expect(value).to.be.undefined;
    });

  });

  describe('manifestBind', function() {

    it('should bind to top level properties', function() {
      const element = $compile('<span manifest-bind="version"></span>')($rootScope);
      $rootScope.$digest();
      m.chai.expect(element.html()).to.equal(packageJSON.version);
    });

    it('should bind to nested properties', function() {
      const element = $compile('<span manifest-bind="repository.type"></span>')($rootScope);
      $rootScope.$digest();
      m.chai.expect(element.html()).to.equal(packageJSON.repository.type);
    });

    it('should throw if the property does not exist', function() {
      m.chai.expect(function() {
        $compile('<span manifest-bind="foo.bar"></span>')($rootScope);
      }).to.throw('ManifestBind: Unknown property `foo.bar`');
    });

  });

});
