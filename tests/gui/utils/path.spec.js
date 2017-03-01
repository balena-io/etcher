'use strict';

const m = require('mochainon');
const angular = require('angular');
const os = require('os');
require('angular-mocks');

describe('Browser: Path', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/utils/path/path')
  ));

  describe('BasenameFilter', function() {

    let basenameFilter;

    beforeEach(angular.mock.inject(function(_basenameFilter_) {
      basenameFilter = _basenameFilter_;
    }));

    it('should return an empty string if no input', function() {
      m.chai.expect(basenameFilter()).to.equal('');
    });

    it('should return the basename', function() {
      const isWindows = os.platform() === 'win32';
      let basename;

      if (isWindows) {
        basename = basenameFilter('C:\\Users\\jviotti\\foo.img');
      } else {
        basename = basenameFilter('/Users/jviotti/foo.img');
      }

      m.chai.expect(basename).to.equal('foo.img');
    });

  });
});
