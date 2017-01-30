'use strict';

const m = require('mochainon');
const path = require('path');
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

  describe('.isSourceDrive()', function() {

    it('should return false if no image', function() {
      const result = constraints.isSourceDrive({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true,
        system: false
      }, undefined);

      m.chai.expect(result).to.be.false;
    });

    it('should return false if no drive', function() {
      const result = constraints.isSourceDrive(undefined, {
        path: '/Volumes/Untitled/image.img'
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return false if there are no mount points', function() {
      const result = constraints.isSourceDrive({
        device: '/dev/disk2',
        name: 'USB Drive',
        size: 999999999,
        protected: true,
        system: false
      }, {
        path: '/Volumes/Untitled/image.img'
      });

      m.chai.expect(result).to.be.false;
    });

    describe('given Windows paths', function() {

      beforeEach(function() {
        this.separator = path.sep;
        path.sep = '\\';
      });

      afterEach(function() {
        path.sep = this.separator;
      });

      it('should return true if the image lives directly inside a mount point of the drive', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: 'E:'
            },
            {
              path: 'F:'
            }
          ]
        }, {
          path: 'E:\\image.img'
        });

        m.chai.expect(result).to.be.true;
      });

      it('should return true if the image lives inside a mount point of the drive', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: 'E:'
            },
            {
              path: 'F:'
            }
          ]
        }, {
          path: 'E:\\foo\\bar\\image.img'
        });

        m.chai.expect(result).to.be.true;
      });

      it('should return false if the image does not live inside a mount point of the drive', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: 'E:'
            },
            {
              path: 'F:'
            }
          ]
        }, {
          path: 'G:\\image.img'
        });

        m.chai.expect(result).to.be.false;
      });

      it('should return false if the image is in a mount point that is a substring of the image mount point', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: 'E:\\fo'
            }
          ]
        }, {
          path: 'E:\\foo/image.img'
        });

        m.chai.expect(result).to.be.false;
      });

    });

    describe('given UNIX paths', function() {

      beforeEach(function() {
        this.separator = path.sep;
        path.sep = '/';
      });

      afterEach(function() {
        path.sep = this.separator;
      });

      it('should return true if the mount point is / and the image lives directly inside it', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: '/'
            }
          ]
        }, {
          path: '/image.img'
        });

        m.chai.expect(result).to.be.true;
      });

      it('should return true if the image lives directly inside a mount point of the drive', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: '/Volumes/A'
            },
            {
              path: '/Volumes/B'
            }
          ]
        }, {
          path: '/Volumes/A/image.img'
        });

        m.chai.expect(result).to.be.true;
      });

      it('should return true if the image lives inside a mount point of the drive', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: '/Volumes/A'
            },
            {
              path: '/Volumes/B'
            }
          ]
        }, {
          path: '/Volumes/A/foo/bar/image.img'
        });

        m.chai.expect(result).to.be.true;
      });

      it('should return false if the image does not live inside a mount point of the drive', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: '/Volumes/A'
            },
            {
              path: '/Volumes/B'
            }
          ]
        }, {
          path: '/Volumes/C/image.img'
        });

        m.chai.expect(result).to.be.false;
      });

      it('should return false if the image is in a mount point that is a substring of the image mount point', function() {
        const result = constraints.isSourceDrive({
          mountpoints: [
            {
              path: '/Volumes/fo'
            }
          ]
        }, {
          path: '/Volumes/foo/image.img'
        });

        m.chai.expect(result).to.be.false;
      });

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

  describe('.isDriveSizeRecommended()', function() {

    it('should return true if the drive size is greater than the recommended size ', function() {
      const result = constraints.isDriveSizeRecommended({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 2000000001,
        protected: false
      }, {
        path: 'rpi.img',
        size: 1000000000,
        recommendedDriveSize: 2000000000
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return true if the drive size is equal to recommended size', function() {
      const result = constraints.isDriveSizeRecommended({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 2000000000,
        protected: false
      }, {
        path: 'rpi.img',
        size: 1000000000,
        recommendedDriveSize: 2000000000
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive size is less than the recommended size', function() {
      const result = constraints.isDriveSizeRecommended({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 2000000000,
        protected: false
      }, {
        path: 'rpi.img',
        size: 1000000000,
        recommendedDriveSize: 2000000001
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return true if the recommended drive size is undefined', function() {
      const result = constraints.isDriveSizeRecommended({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 2000000000,
        protected: false
      }, {
        path: 'rpi.img',
        size: 1000000000
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive is undefined', function() {
      const result = constraints.isDriveSizeRecommended(undefined, {
        path: 'rpi.img',
        size: 1000000000,
        recommendedDriveSize: 1000000000
      });

      m.chai.expect(result).to.be.false;
    });

    it('should return true if the image is undefined', function() {
      const result = constraints.isDriveSizeRecommended({
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 2000000000,
        protected: false
      }, undefined);

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive and image are undefined', function() {
      const result = constraints.isDriveSizeRecommended(undefined, undefined);
      m.chai.expect(result).to.be.true;
    });

  });

  describe('.isDriveValid()', function() {

    beforeEach(function() {
      if (process.platform === 'win32') {
        this.mountpoint = 'E:\\foo';
      } else {
        this.mountpoint = '/mnt/foo';
      }

      this.drive = {
        device: '/dev/disk2',
        name: 'My Drive',
        mountpoints: [
          {
            path: this.mountpoint
          }
        ],
        size: 4000000000
      };
    });

    describe('given the drive is locked', function() {

      beforeEach(function() {
        this.drive.protected = true;
      });

      it('should return false if the drive is not large enough and is a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.join(this.mountpoint, 'rpi.img'),
          size: 5000000000
        })).to.be.false;
      });

      it('should return false if the drive is not large enough and is not a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.resolve(this.mountpoint, '../bar/rpi.img'),
          size: 5000000000
        })).to.be.false;
      });

      it('should return false if the drive is large enough and is a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.join(this.mountpoint, 'rpi.img'),
          size: 2000000000
        })).to.be.false;
      });

      it('should return false if the drive is large enough and is not a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.resolve(this.mountpoint, '../bar/rpi.img'),
          size: 2000000000
        })).to.be.false;
      });

    });

    describe('given the drive is not locked', function() {

      beforeEach(function() {
        this.drive.protected = false;
      });

      it('should return false if the drive is not large enough and is a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.join(this.mountpoint, 'rpi.img'),
          size: 5000000000
        })).to.be.false;
      });

      it('should return false if the drive is not large enough and is not a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.resolve(this.mountpoint, '../bar/rpi.img'),
          size: 5000000000
        })).to.be.false;
      });

      it('should return false if the drive is large enough and is a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.join(this.mountpoint, 'rpi.img'),
          size: 2000000000
        })).to.be.false;
      });

      it('should return true if the drive is large enough and is not a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.resolve(this.mountpoint, '../bar/rpi.img'),
          size: 2000000000
        })).to.be.true;
      });

    });

  });

});
