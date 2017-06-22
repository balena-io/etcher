'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
const units = require('../../../lib/shared/units');

describe('Browser: ByteSize', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/utils/byte-size/byte-size')
  ));

  describe('ClosestUnitFilter', function() {

    let closestUnitFilter;

    beforeEach(angular.mock.inject(function(_closestUnitFilter_) {
      closestUnitFilter = _closestUnitFilter_;
    }));

    it('should expose lib/shared/units.js bytesToGigabytes()', function() {
      m.chai.expect(closestUnitFilter).to.equal(units.bytesToClosestUnit);
    });

  });
});
