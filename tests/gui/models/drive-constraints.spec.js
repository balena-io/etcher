'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');

describe('Browser: DriveConstraints', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/models/drive-constraints')
  ));

  describe('DriveConstraintsModel', function() {

    let DriveConstraintsModel;

    beforeEach(angular.mock.inject(function(_DriveConstraintsModel_) {
      DriveConstraintsModel = _DriveConstraintsModel_;
    }));

    it('should be the `lib/shared/drive-constraints.js` object', function() {
      const DriveConstraints = require('../../../lib/shared/drive-constraints');
      m.chai.expect(Object.is(DriveConstraintsModel, DriveConstraints)).to.be.true;
    });

  });

});
