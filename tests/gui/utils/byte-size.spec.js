'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
const units = require('../../../lib/shared/units');

describe('Browser: ByteSize', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/utils/byte-size/byte-size')
  ));

  describe('GigabyteFilter', function() {

    let gigabyteFilter;

    beforeEach(angular.mock.inject(function(_gigabyteFilter_) {
      gigabyteFilter = _gigabyteFilter_;
    }));

    it('should expose lib/shared/units.js bytesToGigabytes()', function() {
      m.chai.expect(gigabyteFilter).to.equal(units.bytesToGigabytes);
    });

  });
});
