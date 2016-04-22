'use strict';

const m = require('mochainon');
const angular = require('angular');
const os = require('os');
require('angular-mocks');

describe('Browser: ByteSize', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/utils/byte-size/byte-size')
  ));

  describe('GigabyteFilter', function() {

    let gigabyteFilter;

    beforeEach(angular.mock.inject(function(_gigabyteFilter_) {
      gigabyteFilter = _gigabyteFilter_;
    }));

    it('should convert bytes to gigabytes', function() {
      m.chai.expect(gigabyteFilter(7801405440)).to.equal(7.80140544);
      m.chai.expect(gigabyteFilter(100000000)).to.equal(0.1);
    });

  });
});
