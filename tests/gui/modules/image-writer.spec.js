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
          percentage: 0,
          speed: 0
        });
      });

    });

    describe('.resetState()', function() {

      it('should be able to reset the progress state', function() {
        ImageWriterService.state = {
          percentage: 50,
          speed: 3
        };

        ImageWriterService.resetState();
        $timeout.flush();

        m.chai.expect(ImageWriterService.state).to.deep.equal({
          percentage: 0,
          speed: 0
        });
      });

      it('should be able to reset the progress state', function() {
        ImageWriterService.unsetFlashingFlag({
          passedValidation: true,
          cancelled: false,
          sourceChecksum: '1234'
        });

        ImageWriterService.resetState();
        m.chai.expect(ImageWriterService.getFlashResults()).to.deep.equal({});
      });

    });

    describe('.isFlashing()', function() {

      it('should return false by default', function() {
        m.chai.expect(ImageWriterService.isFlashing()).to.be.false;
      });

      it('should return true if flashing', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(ImageWriterService.isFlashing()).to.be.true;
      });

    });

    describe('.setProgressState()', function() {

      it('should not allow setting the state if flashing is false', function() {
        ImageWriterService.unsetFlashingFlag({
          passedValidation: true,
          cancelled: false,
          sourceChecksum: '1234'
        });

        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Can\'t set the flashing state when not flashing');
      });

      it('should throw if type is missing', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            percentage: 50,
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Missing state type');
      });

      it('should throw if type is not a string', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 1234,
            percentage: 50,
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Invalid state type: 1234');
      });

      it('should not throw if percentage is 0', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            percentage: 0,
            eta: 15,
            speed: 100000000000
          });
        }).to.not.throw('Missing state percentage');
      });

      it('should throw if percentage is missing', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Missing state percentage');
      });

      it('should throw if percentage is not a number', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            percentage: '50',
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Invalid state percentage: 50');
      });

      it('should throw if eta is missing', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            percentage: 50,
            speed: 100000000000
          });
        }).to.throw('Missing state eta');
      });

      it('should not throw if eta is equal to zero', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 0,
            speed: 100000000000
          });
        }).to.not.throw('Missing state eta');
      });

      it('should throw if eta is not a number', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            percentage: 50,
            eta: '15',
            speed: 100000000000
          });
        }).to.throw('Invalid state eta: 15');
      });

      it('should throw if speed is missing', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(function() {
          ImageWriterService.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15
          });
        }).to.throw('Missing state speed');
      });

    });

    describe('.getFlashResults()', function() {

      it('should get the flash results', function() {
        ImageWriterService.setFlashingFlag();

        const expectedResults = {
          passedValidation: true,
          cancelled: false,
          sourceChecksum: '1234'
        };

        ImageWriterService.unsetFlashingFlag(expectedResults);
        const results = ImageWriterService.getFlashResults();
        m.chai.expect(results).to.deep.equal(expectedResults);
      });

    });

    describe('.unsetFlashingFlag()', function() {

      it('should throw if no flashing results', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag();
        }).to.throw('Missing results');
      });

      it('should throw if no passedValidation', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag({
            cancelled: false,
            sourceChecksum: '1234'
          });
        }).to.throw('Missing results passedValidation');
      });

      it('should throw if passedValidation is not boolean', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: 'true',
            cancelled: false,
            sourceChecksum: '1234'
          });
        }).to.throw('Invalid results passedValidation: true');
      });

      it('should throw if no cancelled', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: true,
            sourceChecksum: '1234'
          });
        }).to.throw('Missing results cancelled');
      });

      it('should throw if cancelled is not boolean', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: true,
            cancelled: 'false',
            sourceChecksum: '1234'
          });
        }).to.throw('Invalid results cancelled: false');
      });

      it('should throw if passedValidation is true and sourceChecksum does not exist', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: true,
            cancelled: false
          });
        }).to.throw('Missing results sourceChecksum');
      });

      it('should throw if passedValidation is true and sourceChecksum is not a string', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: true,
            cancelled: false,
            sourceChecksum: 12345
          });
        }).to.throw('Invalid results sourceChecksum: 12345');
      });

      it('should throw if cancelled is true and sourceChecksum exists', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: false,
            cancelled: true,
            sourceChecksum: '1234'
          });
        }).to.throw('The sourceChecksum value can\'t exist if the flashing was cancelled');
      });

      it('should throw if cancelled is true and passedValidation is true', function() {
        m.chai.expect(function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: true,
            cancelled: true
          });
        }).to.throw('The passedValidation value can\'t be true if the flashing was cancelled');
      });

      it('should be able to set flashing to false', function() {
        ImageWriterService.unsetFlashingFlag({
          passedValidation: true,
          cancelled: false,
          sourceChecksum: '1234'
        });

        m.chai.expect(ImageWriterService.isFlashing()).to.be.false;
      });

      it('should reset the flashing state', function() {
        ImageWriterService.setFlashingFlag();

        ImageWriterService.setProgressState({
          type: 'write',
          percentage: 50,
          eta: 15,
          speed: 100000000000
        });

        $timeout.flush();

        m.chai.expect(ImageWriterService.state).to.not.deep.equal({
          percentage: 0,
          speed: 0
        });

        ImageWriterService.unsetFlashingFlag({
          passedValidation: true,
          cancelled: false,
          sourceChecksum: '1234'
        });

        $timeout.flush();

        m.chai.expect(ImageWriterService.state).to.deep.equal({
          percentage: 0,
          speed: 0
        });
      });

    });

    describe('.setFlashingFlag()', function() {

      it('should be able to set flashing to true', function() {
        ImageWriterService.setFlashingFlag();
        m.chai.expect(ImageWriterService.isFlashing()).to.be.true;
      });

      it('should reset the flash results', function() {
        const expectedResults = {
          passedValidation: true,
          cancelled: false,
          sourceChecksum: '1234'
        };

        ImageWriterService.unsetFlashingFlag(expectedResults);
        const results = ImageWriterService.getFlashResults();
        m.chai.expect(results).to.deep.equal(expectedResults);
        ImageWriterService.setFlashingFlag();
        m.chai.expect(ImageWriterService.getFlashResults()).to.deep.equal({});
      });

    });

    describe('.flash()', function() {

      describe('given a succesful write', function() {

        beforeEach(function() {
          this.performWriteStub = m.sinon.stub(ImageWriterService, 'performWrite');
          this.performWriteStub.returns($q.resolve({
            passedValidation: true,
            cancelled: false,
            sourceChecksum: '1234'
          }));
        });

        afterEach(function() {
          this.performWriteStub.restore();
        });

        it('should set flashing to false when done', function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: true,
            cancelled: false,
            sourceChecksum: '1234'
          });

          ImageWriterService.flash('foo.img', '/dev/disk2');
          $rootScope.$apply();
          m.chai.expect(ImageWriterService.isFlashing()).to.be.false;
        });

        it('should prevent writing more than once', function() {
          ImageWriterService.unsetFlashingFlag({
            passedValidation: true,
            cancelled: false,
            sourceChecksum: '1234'
          });

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
          ImageWriterService.unsetFlashingFlag({
            passedValidation: true,
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
