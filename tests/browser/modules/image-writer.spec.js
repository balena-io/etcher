'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/modules/image-writer');

describe('Browser: ImageWriter', function() {

  beforeEach(angular.mock.module('ResinEtcher.image-writer'));

  describe('ImageWriterService', function() {

    let $q;
    let $timeout;
    let $rootScope;
    let ImageWriterService;

    beforeEach(angular.mock.inject(function(_$q_, _$timeout_, _$rootScope_, _ImageWriterService_) {
      $q = _$q_;
      $timeout = _$timeout_;
      $rootScope = _$rootScope_;
      ImageWriterService = _ImageWriterService_;
    }));

    describe('.isBurning()', function() {

      it('should return false by default', function() {
        m.chai.expect(ImageWriterService.isBurning()).to.be.false;
      });

      it('should return true if burning', function() {
        ImageWriterService.setBurning(true);
        m.chai.expect(ImageWriterService.isBurning()).to.be.true;
      });

    });

    describe('.setBurning()', function() {

      it('should be able to set burning to true', function() {
        ImageWriterService.setBurning(true);
        m.chai.expect(ImageWriterService.isBurning()).to.be.true;
      });

      it('should be able to set burning to false', function() {
        ImageWriterService.setBurning(false);
        m.chai.expect(ImageWriterService.isBurning()).to.be.false;
      });

      it('should cast to boolean by default', function() {
        ImageWriterService.setBurning('hello');
        m.chai.expect(ImageWriterService.isBurning()).to.be.true;

        ImageWriterService.setBurning('');
        m.chai.expect(ImageWriterService.isBurning()).to.be.false;
      });

    });

    describe('.burn()', function() {

      describe('given a succesful write', function() {

        beforeEach(function() {
          this.performWriteStub = m.sinon.stub(ImageWriterService, 'performWrite');
          this.performWriteStub.returns($q.resolve());
        });

        afterEach(function() {
          this.performWriteStub.restore();
        });

        it('should set burning to false when done', function() {
          ImageWriterService.burn('foo.img', '/dev/disk2');
          $rootScope.$apply();
          m.chai.expect(ImageWriterService.isBurning()).to.be.false;
        });

        it('should prevent writing more than once', function() {
          ImageWriterService.burn('foo.img', '/dev/disk2');
          ImageWriterService.burn('foo.img', '/dev/disk2');
          $rootScope.$apply();
          m.chai.expect(this.performWriteStub).to.have.been.calledOnce;
        });

      });

      describe('given an unsuccesful write', function() {

        beforeEach(function() {
          this.performWriteStub = m.sinon.stub(ImageWriterService, 'performWrite');
          this.performWriteStub.returns($q.reject(new Error('write error')));
        });

        afterEach(function() {
          this.performWriteStub.restore();
        });

        it('should set burning to false when done', function() {
          ImageWriterService.burn('foo.img', '/dev/disk2');
          $rootScope.$apply();
          m.chai.expect(ImageWriterService.isBurning()).to.be.false;
        });

        it('should be rejected with the error', function() {
          let rejection;
          ImageWriterService.burn('foo.img', '/dev/disk2').catch(function(error) {
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
