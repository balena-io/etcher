'use strict';

const m = require('mochainon');
const constraints = require('../../lib/shared/drive-constraints');

describe('Shared: DriveConstraints', function() {

  describe('.isDriveLocked()', function() {

    it('should return true if the drive is protected', function() {
      const result = constraints.isDriveLocked({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive is not protected', function() {
      const result = constraints.isDriveLocked({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: false
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return false if we don\'t know if the drive is protected', function() {
      const result = constraints.isDriveLocked({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return false if the drive is undefined', function() {
      const result = constraints.isDriveLocked(undefined);

      m.chai.expect(result).to.be.false;
    });

  });

  describe('.isSystemDrive()', function() {

    it('should return true if the drive is a system drive', function() {
      const result = constraints.isSystemDrive({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true,
        system: true
      });

      m.chai.expect(result).to.be.true;
    });

    it('should default to `false` if the `system` property is `undefined`', function() {
      const result = constraints.isSystemDrive({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return false if the drive is a removable drive', function() {
      const result = constraints.isSystemDrive({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true,
        system: false
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return false if the drive is undefined', function() {
      const result = constraints.isSystemDrive(undefined);

      m.chai.expect(result).to.be.false;
    });

  });

  describe('.isDriveLargeEnough()', function() {

    it('should return true if the drive size is greater than the image size', function() {
      const result = constraints.isDriveLargeEnough({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 1000000001,
        protected: false
      }, {
        path: 'rpi.img',
        size: 1000000000
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return true if the drive size is equal to the image size', function() {
      const result = constraints.isDriveLargeEnough({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 1000000000,
        protected: false
      }, {
        path: 'rpi.img',
        size: 1000000000
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive size is less than the image size', function() {
      const result = constraints.isDriveLargeEnough({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 1000000000,
        protected: false
      }, {
        path: 'rpi.img',
        size: 1000000001
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return false if the drive is undefined', function() {
      const result = constraints.isDriveLargeEnough(undefined, {
        path: 'rpi.img',
        size: 1000000000
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return true if the image is undefined', function() {
      const result = constraints.isDriveLargeEnough({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 1000000000,
        protected: false
      }, undefined);

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive and image are undefined', function() {
      const result = constraints.isDriveLargeEnough(undefined, undefined);
      m.chai.expect(result).to.be.true;
    });

  });

  describe('.isDriveValid()', function() {

    describe('given drive is large enough', function() {

      beforeEach(function() {
        this.drive = {
          device: '/dev/disk2',
          name: 'My Drive',
          size: 4000000000
        };
        this.image = {
          path: 'rpi.img',
          size: 2000000000
        };
      });

      it('should return true if drive is not locked', function() {
        this.drive.protected = false;
        m.chai.expect(constraints.isDriveValid(this.drive, this.image)).to.be.true;
      });

      it('should return false if drive is locked', function() {
        this.drive.protected = true;
        m.chai.expect(constraints.isDriveValid(this.drive, this.image)).to.be.false;
      });

    });

    describe('given drive is not large enough', function() {

      beforeEach(function() {
        this.drive = {
          device: '/dev/disk2',
          name: 'My Drive',
          size: 1000000000
        };
        this.image = {
          path: 'rpi.img',
          size: 2000000000
        };
      });

      it('should return false', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, this.image)).to.be.false;
      });

    });

  });

});
