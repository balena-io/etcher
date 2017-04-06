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
require('angular-mocks');

describe('Browser: OSDropzone', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/os/dropzone/dropzone')
  ));

  describe('osDropzone', function() {

    let $compile;
    let $rootScope;
    let $timeout;

    beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, _$timeout_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
    }));

    it('should pass the file back to the callback as $file', function(done) {
      $rootScope.onDropZone = function(file) {
        m.chai.expect(file).to.deep.equal('/foo/bar');
        done();
      };

      const element = $compile('<div os-dropzone="onDropZone($file)">Drop a file here</div>')($rootScope);
      $rootScope.$digest();

      element[0].ondrop({
        preventDefault: angular.noop,
        dataTransfer: {
          files: [
            {
              path: '/foo/bar'
            }
          ]
        }
      });

      $rootScope.$digest();
      $timeout.flush();
    });

    it('should pass undefined to the callback if not passing $file', function(done) {
      $rootScope.onDropZone = function(file) {
        m.chai.expect(file).to.be.undefined;
        done();
      };

      const element = $compile('<div os-dropzone="onDropZone()">Drop a file here</div>')($rootScope);
      $rootScope.$digest();

      element[0].ondrop({
        preventDefault: angular.noop,
        dataTransfer: {
          files: [
            {
              path: '/foo/bar'
            }
          ]
        }
      });

      $rootScope.$digest();
      $timeout.flush();
    });

  });

});
