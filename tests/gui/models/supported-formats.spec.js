'use strict';

const m = require('mochainon');
const _ = require('lodash');
const angular = require('angular');
require('angular-mocks');

describe('Browser: SupportedFormats', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/models/supported-formats')
  ));

  describe('SupportedFormatsModel', function() {

    let SupportedFormatsModel;

    beforeEach(angular.mock.inject(function(_SupportedFormatsModel_) {
      SupportedFormatsModel = _SupportedFormatsModel_;
    }));

    describe('.getCompressedExtensions()', function() {

      it('should return the supported compressed extensions', function() {
        const extensions = SupportedFormatsModel.getCompressedExtensions();
        m.chai.expect(extensions).to.deep.equal([ 'zip', 'gz', 'bz2', 'xz' ]);
      });

    });

    describe('.getNonCompressedExtensions()', function() {

      it('should return the supported non compressed extensions', function() {
        const extensions = SupportedFormatsModel.getNonCompressedExtensions();
        m.chai.expect(extensions).to.deep.equal([ 'img', 'iso' ]);
      });

    });

    describe('.getAllExtensions()', function() {

      it('should return the union of .getCompressedExtensions and .getNonCompressedExtensions', function() {
        const compressedExtensions = SupportedFormatsModel.getCompressedExtensions();
        const nonCompressedExtensions = SupportedFormatsModel.getNonCompressedExtensions();
        const expected = _.union(compressedExtensions, nonCompressedExtensions);
        const extensions = SupportedFormatsModel.getAllExtensions();
        m.chai.expect(extensions).to.deep.equal(expected);
      });

    });

  });

});
