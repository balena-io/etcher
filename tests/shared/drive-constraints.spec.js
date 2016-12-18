'use strict';

const m = require('mochainon');
const DriveConstraints = require('../../lib/shared/drive-constraints');

describe('(new DriveConstraints())', function() {

  beforeEach(function() {
    this.constraints = new DriveConstraints();
  });

  describe('.isDriveLocked()', function() {

    it('should return true if the drive is protected', function() {
      const result = this.constraints.isDriveLocked({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive is not protected', function() {
      const result = this.constraints.isDriveLocked({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: false
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return false if we don\'t know if the drive is protected', function() {
      const result = this.constraints.isDriveLocked({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999
      });

      m.chai.expect(result).to.be.false;
    });

  });

  describe('.isSystemDrive()', function() {

    it('should return true if the drive is a system drive', function() {
      const result = this.constraints.isSystemDrive({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true,
        system: true
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive is a removable drive', function() {
      const result = this.constraints.isSystemDrive({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true,
        system: false
      });

      m.chai.expect(result).to.be.false;
    });
  });

});
