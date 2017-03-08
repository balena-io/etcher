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
        m.chai.expect(extensions).to.deep.equal([ 'gz', 'bz2', 'xz' ]);
      });

    });

    describe('.getNonCompressedExtensions()', function() {

      it('should return the supported non compressed extensions', function() {
        const extensions = SupportedFormatsModel.getNonCompressedExtensions();
        m.chai.expect(extensions).to.deep.equal([ 'img', 'iso', 'dsk', 'hddimg', 'raw' ]);
      });

    });

    describe('.getArchiveExtensions()', function() {

      it('should return the supported archive extensions', function() {
        const extensions = SupportedFormatsModel.getArchiveExtensions();
        m.chai.expect(extensions).to.deep.equal([ 'zip', 'etch' ]);
      });

    });

    describe('.getAllExtensions()', function() {

      it('should return the union of all compressed, uncompressed, and archive extensions', function() {
        const archiveExtensions = SupportedFormatsModel.getArchiveExtensions();
        const compressedExtensions = SupportedFormatsModel.getCompressedExtensions();
        const nonCompressedExtensions = SupportedFormatsModel.getNonCompressedExtensions();
        const expected = _.union(archiveExtensions, compressedExtensions, nonCompressedExtensions);
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
        const nonCompressedExtension = _.first(SupportedFormatsModel.getNonCompressedExtensions());
        const imagePath = `/path/to/foo.${nonCompressedExtension}`;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should ignore casing when determining extension validity', function() {
        const nonCompressedExtension = _.first(SupportedFormatsModel.getNonCompressedExtensions());
        const imagePath = `/path/to/foo.${nonCompressedExtension.toUpperCase()}`;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should not consider an extension before a non compressed extension', function() {
        const nonCompressedExtension = _.first(SupportedFormatsModel.getNonCompressedExtensions());
        const imagePath = `/path/to/foo.1234.${nonCompressedExtension}`;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should return true if the extension is supported and the file name includes dots', function() {
        const nonCompressedExtension = _.first(SupportedFormatsModel.getNonCompressedExtensions());
        const imagePath = `/path/to/foo.1.2.3-bar.${nonCompressedExtension}`;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should return true if the extension is only a supported archive extension', function() {
        const archiveExtension = _.first(SupportedFormatsModel.getArchiveExtensions());
        const imagePath = `/path/to/foo.${archiveExtension}`;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should return true if the extension is a supported one plus a supported compressed extensions', function() {
        const nonCompressedExtension = _.first(SupportedFormatsModel.getNonCompressedExtensions());
        const compressedExtension = _.first(SupportedFormatsModel.getCompressedExtensions());
        const imagePath = `/path/to/foo.${nonCompressedExtension}.${compressedExtension}`;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.true;
      });

      it('should return false if the extension is an unsupported one plus a supported compressed extensions', function() {
        const compressedExtension = _.first(SupportedFormatsModel.getCompressedExtensions());
        const imagePath = `/path/to/foo.jpg.${compressedExtension}`;
        const isSupported = SupportedFormatsModel.isSupportedImage(imagePath);
        m.chai.expect(isSupported).to.be.false;
      });

    });

    describe('.looksLikeWindowsImage()', function() {

      _.each([
        'C:\\path\\to\\en_windows_10_multiple_editions_version_1607_updated_jan_2017_x64_dvd_9714399.iso',
        '/path/to/en_windows_10_multiple_editions_version_1607_updated_jan_2017_x64_dvd_9714399.iso',
        '/path/to/Win10_1607_SingleLang_English_x32.iso',
        '/path/to/en_winxp_pro_x86_build2600_iso.img'
      ], (imagePath) => {

        it(`should return true if filename is ${imagePath}`, function() {
          const looksLikeWindowsImage = SupportedFormatsModel.looksLikeWindowsImage(imagePath);
          m.chai.expect(looksLikeWindowsImage).to.be.true;
        });

      });

      _.each([
        'C:\\path\\to\\2017-01-11-raspbian-jessie.img',
        '/path/to/2017-01-11-raspbian-jessie.img'
      ], (imagePath) => {

        it(`should return false if filename is ${imagePath}`, function() {
          const looksLikeWindowsImage = SupportedFormatsModel.looksLikeWindowsImage(imagePath);
          m.chai.expect(looksLikeWindowsImage).to.be.false;
        });

      });

    });

  });

});
