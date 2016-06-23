'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');

describe('Browser: ImageWriter', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/modules/image-writer')
  ));

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

    describe('.state', function() {

      it('should be reset by default', function() {
        m.chai.expect(ImageWriterService.state).to.deep.equal({
          progress: 0,
          speed: 0
        });
      });

    });

    describe('.resetState()', function() {

      it('should be able to reset the state', function() {
        ImageWriterService.state = {
          progress: 50,
          speed: 3
        };

        ImageWriterService.resetState();
        $timeout.flush();

        m.chai.expect(ImageWriterService.state).to.deep.equal({
          progress: 0,
          speed: 0
        });
      });

    });

    describe('.isFlashing()', function() {

      it('should return false by default', function() {
        m.chai.expect(ImageWriterService.isFlashing()).to.be.false;
      });

      it('should return true if flashing', function() {
        ImageWriterService.setFlashing(true);
        m.chai.expect(ImageWriterService.isFlashing()).to.be.true;
      });

    });

    describe('.setProgressState()', function() {

      it('should not allow setting the state if flashing is false', function() {
        ImageWriterService.setFlashing(false);
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Can\'t set the flashing state when not flashing');
      });

    });

    describe('.setFlashing()', function() {

      it('should be able to set flashing to true', function() {
        ImageWriterService.setFlashing(true);
        m.chai.expect(ImageWriterService.isFlashing()).to.be.true;
      });

      it('should be able to set flashing to false', function() {
        ImageWriterService.setFlashing(false);
        m.chai.expect(ImageWriterService.isFlashing()).to.be.false;
      });

      it('should cast to boolean by default', function() {
        ImageWriterService.setFlashing('hello');
        m.chai.expect(ImageWriterService.isFlashing()).to.be.true;

        ImageWriterService.setFlashing('');
        m.chai.expect(ImageWriterService.isFlashing()).to.be.false;
      });

      it('should reset the flashing state if set to false', function() {
        ImageWriterService.setFlashing(true);

        ImageWriterService.setProgressState({
          type: 'write',
          percentage: 50,
          eta: 15,
          speed: 100000000000
        });

        $timeout.flush();

        m.chai.expect(ImageWriterService.state).to.not.deep.equal({
          progress: 0,
          speed: 0
        });

        ImageWriterService.setFlashing(false);

        $timeout.flush();

        m.chai.expect(ImageWriterService.state).to.deep.equal({
          progress: 0,
          speed: 0
        });
      });

    });

    describe('.flash()', function() {

      describe('given a succesful write', function() {

        beforeEach(function() {
          this.performWriteStub = m.sinon.stub(ImageWriterService, 'performWrite');
          this.performWriteStub.returns($q.resolve());
        });

        afterEach(function() {
          this.performWriteStub.restore();
        });

        it('should set flashing to false when done', function() {
          ImageWriterService.setFlashing(false);
          ImageWriterService.flash('foo.img', '/dev/disk2');
          $rootScope.$apply();
          m.chai.expect(ImageWriterService.isFlashing()).to.be.false;
        });

        it('should prevent writing more than once', function() {
          ImageWriterService.setFlashing(false);
          ImageWriterService.flash('foo.img', '/dev/disk2');
          ImageWriterService.flash('foo.img', '/dev/disk2');
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

      describe('given an unsuccesful write', function() {

        beforeEach(function() {
          this.performWriteStub = m.sinon.stub(ImageWriterService, 'performWrite');
          this.performWriteStub.returns($q.reject(new Error('write error')));
        });

        afterEach(function() {
          this.performWriteStub.restore();
        });

        it('should set flashing to false when done', function() {
          ImageWriterService.flash('foo.img', '/dev/disk2');
          $rootScope.$apply();
          m.chai.expect(ImageWriterService.isFlashing()).to.be.false;
        });

        it('should be rejected with the error', function() {
          ImageWriterService.setFlashing(false);

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
