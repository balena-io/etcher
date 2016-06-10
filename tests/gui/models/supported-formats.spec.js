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

    describe('.isSupportedImage()', function() {

      it('should return false if the file has no extension', function() {
        const isSupported = SupportedFormatsModel.isSupportedImage('/path/to/foo');
        m.chai.expect(isSupported).to.be.false;
      });

      it('should return false if the extension is not included in .getAllExtensions()', function() {
        const isSupported = SupportedFormatsModel.isSupportedImage('/path/to/foo.jpg');
        m.chai.expect(isSupported).to.be.false;
      });

      it('should return true if the extension is included in .getAllExtensions()', function() {
        const supportedExtensions = SupportedFormatsModel.getAllExtensions();
        const imagePath = '/path/to/foo.' + _.first(supportedExtensions);
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should return true if the extension is supported and the file name includes dots', function() {
        const supportedExtensions = SupportedFormatsModel.getAllExtensions();
        const imagePath = '/path/to/foo.1.2.3-bar.' + _.first(supportedExtensions);
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should return true if the extension is a supported one plus a supported compressed extensions', function() {
        const nonCompressedExtension = _.first(SupportedFormatsModel.getNonCompressedExtensions());
        const compressedExtension = _.first(SupportedFormatsModel.getCompressedExtensions());
        const imagePath = '/path/to/foo.' + nonCompressedExtension + '.' + compressedExtension;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should return false if the extension is an unsupported one plus a supported compressed extensions', function() {
        const compressedExtension = _.first(SupportedFormatsModel.getCompressedExtensions());
        const imagePath = '/path/to/foo.jpg.' + compressedExtension;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.false;
      });

    });

  });

});
