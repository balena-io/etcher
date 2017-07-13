'use strict';

const m = require('mochainon');
const angular = require('angular');
const flashState = require('../../../lib/shared/models/flash-state');
require('angular-mocks');

describe('Browser: ImageWriter', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/modules/image-writer')
  ));

  describe('ImageWriterService', function() {

    let $q;
    let $rootScope;
    let ImageWriterService;

    beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _ImageWriterService_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      ImageWriterService = _ImageWriterService_;
    }));

    describe('.flash()', function() {

      describe('given a successful write', function() {

        beforeEach(function() {
          this.performWriteStub = m.sinon.stub(ImageWriterService, 'performWrite');
          this.performWriteStub.returns($q.resolve({
            cancelled: false,
            sourceChecksum: '1234'
          }));
        });

        afterEach(function() {
          this.performWriteStub.restore();
        });

        it('should set flashing to false when done', function() {
          flashState.unsetFlashingFlag({
            cancelled: false,
            sourceChecksum: '1234'
          });

          ImageWriterService.flash('foo.img', '/dev/disk2');
          $rootScope.$apply();
          m.chai.expect(flashState.isFlashing()).to.be.false;
        });

        it('should prevent writing more than once', function() {
          flashState.unsetFlashingFlag({
            cancelled: false,
            sourceChecksum: '1234'
          });

          ImageWriterService.flash('foo.img', '/dev/disk2');
          ImageWriterService.flash('foo.img', '/dev/disk2').catch(angular.noop);
          $rootScope.$apply();
          m.chai.expect(this.performWriteStub).to.have.been.calledOnce;
        });

        it('should reject the second flash attempt', function() {
          ImageWriterService.flash('foo.img', '/dev/disk2');

          let rejectError = null;
          ImageWriterService.flash('foo.img', '/dev/disk2').catch(function(error) {
            rejectError = error;
          });

          $rootScope.$apply();

          m.chai.expect(rejectError).to.be.an.instanceof(Error);
          m.chai.expect(rejectError.message).to.equal('There is already a flash in progress');
        });

      });

      describe('given an unsuccessful write', function() {

        beforeEach(function() {
          this.performWriteStub = m.sinon.stub(ImageWriterService, 'performWrite');
          this.error = new Error('write error');
          this.error.code = 'FOO';
          this.performWriteStub.returns($q.reject(this.error));
        });

        afterEach(function() {
          this.performWriteStub.restore();
        });

        it('should set flashing to false when done', function() {
          ImageWriterService.flash('foo.img', '/dev/disk2').catch(angular.noop);
          $rootScope.$apply();
          m.chai.expect(flashState.isFlashing()).to.be.false;
        });

        it('should set the error code in the flash results', function() {
          ImageWriterService.flash('foo.img', '/dev/disk2').catch(angular.noop);
          $rootScope.$apply();
          const flashResults = flashState.getFlashResults();
          m.chai.expect(flashResults.errorCode).to.equal('FOO');
        });

        it('should be rejected with the error', function() {
          flashState.unsetFlashingFlag({
            cancelled: false,
            sourceChecksum: '1234'
          });

          let rejection;
          ImageWriterService.flash('foo.img', '/dev/disk2').catch(function(error) {
            rejection = error;
          });

          $rootScope.$apply();

          m.chai.expect(rejection).to.be.an.instanceof(Error);
          m.chai.expect(rejection.message).to.equal('write error');
        });

      });

    });

  });

});
