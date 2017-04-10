'use strict';

const m = require('mochainon');
const flashState = require('../../../lib/gui/models/flash-state');

describe('Browser: flashState', function() {

  describe('flashState', function() {

    describe('.resetState()', function() {

      it('should be able to reset the progress state', function() {
        flashState.setFlashingFlag();
        flashState.setProgressState({
          type: 'write',
          percentage: 50,
          eta: 15,
          speed: 100000000000
        });

        flashState.resetState();

        m.chai.expect(flashState.getFlashState()).to.deep.equal({
          percentage: 0,
          speed: 0
        });
      });

      it('should be able to reset the progress state', function() {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        });

        flashState.resetState();
        m.chai.expect(flashState.getFlashResults()).to.deep.equal({});
      });

    });

    describe('.isFlashing()', function() {

      it('should return false by default', function() {
        m.chai.expect(flashState.isFlashing()).to.be.false;
      });

      it('should return true if flashing', function() {
        flashState.setFlashingFlag();
        m.chai.expect(flashState.isFlashing()).to.be.true;
      });

    });

    describe('.setProgressState()', function() {

      it('should not allow setting the state if flashing is false', function() {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        });

        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Can\'t set the flashing state when not flashing');
      });

      it('should throw if type is missing', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            percentage: 50,
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Missing state type');
      });

      it('should throw if type is not a string', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 1234,
            percentage: 50,
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Invalid state type: 1234');
      });

      it('should not throw if percentage is 0', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            percentage: 0,
            eta: 15,
            speed: 100000000000
          });
        }).to.not.throw('Missing state percentage');
      });

      it('should throw if percentage is missing', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Missing state percentage');
      });

      it('should throw if percentage is not a number', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            percentage: '50',
            eta: 15,
            speed: 100000000000
          });
        }).to.throw('Invalid state percentage: 50');
      });

      it('should throw if eta is missing', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            speed: 100000000000
          });
        }).to.throw('Missing state eta');
      });

      it('should not throw if eta is equal to zero', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 0,
            speed: 100000000000
          });
        }).to.not.throw('Missing state eta');
      });

      it('should throw if eta is not a number', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: '15',
            speed: 100000000000
          });
        }).to.throw('Invalid state eta: 15');
      });

      it('should throw if speed is missing', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15
          });
        }).to.throw('Missing state speed');
      });

      it('should not throw if speed is 0', function() {
        flashState.setFlashingFlag();
        m.chai.expect(function() {
          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15,
            speed: 0
          });
        }).to.not.throw('Missing state speed');
      });

    });

    describe('.getFlashResults()', function() {

      it('should get the flash results', function() {
        flashState.setFlashingFlag();

        const expectedResults = {
          cancelled: false,
          sourceChecksum: '1234'
        };

        flashState.unsetFlashingFlag(expectedResults);
        const results = flashState.getFlashResults();
        m.chai.expect(results).to.deep.equal(expectedResults);
      });

    });

    describe('.getFlashState()', function() {

      it('should initially return an empty state', function() {
        flashState.resetState();
        const currentFlashState = flashState.getFlashState();
        m.chai.expect(currentFlashState).to.deep.equal({
          percentage: 0,
          speed: 0
        });
      });

      it('should return the current flash state', function() {
        const state = {
          type: 'write',
          percentage: 50,
          eta: 15,
          speed: 0
        };

        flashState.setFlashingFlag();
        flashState.setProgressState(state);
        const currentFlashState = flashState.getFlashState();
        m.chai.expect(currentFlashState).to.deep.equal(state);
      });

    });

    describe('.unsetFlashingFlag()', function() {

      it('should throw if no flashing results', function() {
        m.chai.expect(function() {
          flashState.unsetFlashingFlag();
        }).to.throw('Missing results');
      });

      it('should be able to set a string error code', function() {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234',
          errorCode: 'EBUSY'
        });

        m.chai.expect(flashState.getLastFlashErrorCode()).to.equal('EBUSY');
      });

      it('should be able to set a number error code', function() {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234',
          errorCode: 123
        });

        m.chai.expect(flashState.getLastFlashErrorCode()).to.equal(123);
      });

      it('should throw if errorCode is not a number not a string', function() {
        m.chai.expect(function() {
          flashState.unsetFlashingFlag({
            cancelled: false,
            sourceChecksum: '1234',
            errorCode: {
              name: 'EBUSY'
            }
          });
        }).to.throw('Invalid results errorCode: [object Object]');
      });

      it('should default cancelled to false', function() {
        flashState.unsetFlashingFlag({
          sourceChecksum: '1234'
        });

        const flashResults = flashState.getFlashResults();

        m.chai.expect(flashResults).to.deep.equal({
          cancelled: false,
          sourceChecksum: '1234'
        });
      });

      it('should throw if cancelled is not boolean', function() {
        m.chai.expect(function() {
          flashState.unsetFlashingFlag({
            cancelled: 'false',
            sourceChecksum: '1234'
          });
        }).to.throw('Invalid results cancelled: false');
      });

      it('should throw if cancelled is true and sourceChecksum exists', function() {
        m.chai.expect(function() {
          flashState.unsetFlashingFlag({
            cancelled: true,
            sourceChecksum: '1234'
          });
        }).to.throw('The sourceChecksum value can\'t exist if the flashing was cancelled');
      });

      it('should be able to set flashing to false', function() {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        });

        m.chai.expect(flashState.isFlashing()).to.be.false;
      });

      it('should reset the flashing state', function() {
        flashState.setFlashingFlag();

        flashState.setProgressState({
          type: 'write',
          percentage: 50,
          eta: 15,
          speed: 100000000000
        });

        m.chai.expect(flashState.getFlashState()).to.not.deep.equal({
          percentage: 0,
          speed: 0
        });

        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        });

        m.chai.expect(flashState.getFlashState()).to.deep.equal({
          percentage: 0,
          speed: 0
        });
      });

    });

    describe('.setFlashingFlag()', function() {

      it('should be able to set flashing to true', function() {
        flashState.setFlashingFlag();
        m.chai.expect(flashState.isFlashing()).to.be.true;
      });

      it('should reset the flash results', function() {
        const expectedResults = {
          cancelled: false,
          sourceChecksum: '1234'
        };

        flashState.unsetFlashingFlag(expectedResults);
        const results = flashState.getFlashResults();
        m.chai.expect(results).to.deep.equal(expectedResults);
        flashState.setFlashingFlag();
        m.chai.expect(flashState.getFlashResults()).to.deep.equal({});
      });

    });

    describe('.wasLastFlashCancelled()', function() {

      it('should return false given a pristine state', function() {
        flashState.resetState();
        m.chai.expect(flashState.wasLastFlashCancelled()).to.be.false;
      });

      it('should return false if !cancelled', function() {
        flashState.unsetFlashingFlag({
          sourceChecksum: '1234',
          cancelled: false
        });

        m.chai.expect(flashState.wasLastFlashCancelled()).to.be.false;
      });

      it('should return true if cancelled', function() {
        flashState.unsetFlashingFlag({
          cancelled: true
        });

        m.chai.expect(flashState.wasLastFlashCancelled()).to.be.true;
      });

    });

    describe('.getLastFlashSourceChecksum()', function() {

      it('should return undefined given a pristine state', function() {
        flashState.resetState();
        m.chai.expect(flashState.getLastFlashSourceChecksum()).to.be.undefined;
      });

      it('should return the last flash source checksum', function() {
        flashState.unsetFlashingFlag({
          sourceChecksum: '1234',
          cancelled: false
        });

        m.chai.expect(flashState.getLastFlashSourceChecksum()).to.equal('1234');
      });

      it('should return undefined if the last flash was cancelled', function() {
        flashState.unsetFlashingFlag({
          cancelled: true
        });

        m.chai.expect(flashState.getLastFlashSourceChecksum()).to.be.undefined;
      });

    });

    describe('.getLastFlashErrorCode()', function() {

      it('should return undefined given a pristine state', function() {
        flashState.resetState();
        m.chai.expect(flashState.getLastFlashErrorCode()).to.be.undefined;
      });

      it('should return the last flash error code', function() {
        flashState.unsetFlashingFlag({
          sourceChecksum: '1234',
          cancelled: false,
          errorCode: 'ENOSPC'
        });

        m.chai.expect(flashState.getLastFlashErrorCode()).to.equal('ENOSPC');
      });

      it('should return undefined if the last flash did not report an error code', function() {
        flashState.unsetFlashingFlag({
          sourceChecksum: '1234',
          cancelled: false
        });

        m.chai.expect(flashState.getLastFlashErrorCode()).to.be.undefined;
      });

    });

  });

});
