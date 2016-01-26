var m = require('mochainon');
var angular = require('angular');
var os = require('os');
require('angular-mocks');
require('../../../lib/browser/modules/path');

describe('Browser: Path', function() {
  'use strict';

  beforeEach(angular.mock.module('ResinEtcher.path'));

  describe('BasenameFilter', function() {

    var basenameFilter;

    beforeEach(angular.mock.inject(function(_basenameFilter_) {
      basenameFilter = _basenameFilter_;
    }));

    it('should return the basename', function() {
      var isWindows = os.platform() === 'win32';
      var basename;

      if (isWindows) {
        basename = basenameFilter('C:\\Users\\jviotti\\foo.img');
      } else {
        basename = basenameFilter('/Users/jviotti/foo.img');
      }

      m.chai.expect(basename).to.equal('foo.img');
    });

  });
});
