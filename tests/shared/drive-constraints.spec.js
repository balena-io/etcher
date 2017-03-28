'use strict';

const m = require('mochainon');
const _ = require('lodash');
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

    beforeEach(function() {
      this.drive = {
        device: '/dev/disk1',
        name: 'USB Drive',
        size: 1000000000,
        protected: false
      };
    });

    describe('given the final image size estimation flag is false', function() {

      describe('given the original size is less than the drive size', function() {

        beforeEach(function() {
          this.image = {
            path: path.join(__dirname, 'rpi.img'),
            size: {
              original: this.drive.size - 1,
              final: {
                estimation: false
              }
            }
          };
        });

        it('should return true if the final size is less than the drive size', function() {
          this.image.size.final.value = this.drive.size - 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return true if the final size is equal to the drive size', function() {
          this.image.size.final.value = this.drive.size;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return false if the final size is greater than the drive size', function() {
          this.image.size.final.value = this.drive.size + 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.false;
        });

      });

      describe('given the original size is equal to the drive size', function() {

        beforeEach(function() {
          this.image = {
            path: path.join(__dirname, 'rpi.img'),
            size: {
              original: this.drive.size,
              final: {
                estimation: false
              }
            }
          };
        });

        it('should return true if the final size is less than the drive size', function() {
          this.image.size.final.value = this.drive.size - 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return true if the final size is equal to the drive size', function() {
          this.image.size.final.value = this.drive.size;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return false if the final size is greater than the drive size', function() {
          this.image.size.final.value = this.drive.size + 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.false;
        });

      });

      describe('given the original size is greater than the drive size', function() {

        beforeEach(function() {
          this.image = {
            path: path.join(__dirname, 'rpi.img'),
            size: {
              original: this.drive.size + 1,
              final: {
                estimation: false
              }
            }
          };
        });

        it('should return true if the final size is less than the drive size', function() {
          this.image.size.final.value = this.drive.size - 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return true if the final size is equal to the drive size', function() {
          this.image.size.final.value = this.drive.size;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return false if the final size is greater than the drive size', function() {
          this.image.size.final.value = this.drive.size + 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.false;
        });

      });

    });

    describe('given the final image size estimation flag is true', function() {

      describe('given the original size is less than the drive size', function() {

        beforeEach(function() {
          this.image = {
            path: path.join(__dirname, 'rpi.img'),
            size: {
              original: this.drive.size - 1,
              final: {
                estimation: true
              }
            }
          };
        });

        it('should return true if the final size is less than the drive size', function() {
          this.image.size.final.value = this.drive.size - 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return true if the final size is equal to the drive size', function() {
          this.image.size.final.value = this.drive.size;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return true if the final size is greater than the drive size', function() {
          this.image.size.final.value = this.drive.size + 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

      });

      describe('given the original size is equal to the drive size', function() {

        beforeEach(function() {
          this.image = {
            path: path.join(__dirname, 'rpi.img'),
            size: {
              original: this.drive.size,
              final: {
                estimation: true
              }
            }
          };
        });

        it('should return true if the final size is less than the drive size', function() {
          this.image.size.final.value = this.drive.size - 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return true if the final size is equal to the drive size', function() {
          this.image.size.final.value = this.drive.size;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

        it('should return true if the final size is greater than the drive size', function() {
          this.image.size.final.value = this.drive.size + 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.true;
        });

      });

      describe('given the original size is greater than the drive size', function() {

        beforeEach(function() {
          this.image = {
            path: path.join(__dirname, 'rpi.img'),
            size: {
              original: this.drive.size + 1,
              final: {
                estimation: true
              }
            }
          };
        });

        it('should return false if the final size is less than the drive size', function() {
          this.image.size.final.value = this.drive.size - 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.false;
        });

        it('should return false if the final size is equal to the drive size', function() {
          this.image.size.final.value = this.drive.size;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.false;
        });

        it('should return false if the final size is greater than the drive size', function() {
          this.image.size.final.value = this.drive.size + 1;
          m.chai.expect(constraints.isDriveLargeEnough(this.drive, this.image)).to.be.false;
        });

      });

    });

    it('should return false if the drive is undefined', function() {
      const result = constraints.isDriveLargeEnough(undefined, {
        path: path.join(__dirname, 'rpi.img'),
        size: {
          original: 1000000000,
          final: {
            estimation: false,
            value: 1000000000
          }
        }
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
        path: path.join(__dirname, 'rpi.img'),
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
        path: path.join(__dirname, 'rpi.img'),
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
        path: path.join(__dirname, 'rpi.img'),
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
        path: path.join(__dirname, 'rpi.img'),
        size: 1000000000
      });

      m.chai.expect(result).to.be.true;
    });

    it('should return false if the drive is undefined', function() {
      const result = constraints.isDriveSizeRecommended(undefined, {
        path: path.join(__dirname, 'rpi.img'),
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
          size: {
            original: 5000000000,
            final: {
              estimation: false,
              value: 5000000000
            }
          }
        })).to.be.false;
      });

      it('should return false if the drive is not large enough and is not a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.resolve(this.mountpoint, '../bar/rpi.img'),
          size: {
            original: 5000000000,
            final: {
              estimation: false,
              value: 5000000000
            }
          }
        })).to.be.false;
      });

      it('should return false if the drive is large enough and is a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.join(this.mountpoint, 'rpi.img'),
          size: {
            original: 2000000000,
            final: {
              estimation: false,
              value: 2000000000
            }
          }
        })).to.be.false;
      });

      it('should return false if the drive is large enough and is not a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.resolve(this.mountpoint, '../bar/rpi.img'),
          size: {
            original: 2000000000,
            final: {
              estimation: false,
              value: 2000000000
            }
          }
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
          size: {
            original: 5000000000,
            final: {
              estimation: false,
              value: 5000000000
            }
          }
        })).to.be.false;
      });

      it('should return false if the drive is not large enough and is not a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.resolve(this.mountpoint, '../bar/rpi.img'),
          size: {
            original: 5000000000,
            final: {
              estimation: false,
              value: 5000000000
            }
          }
        })).to.be.false;
      });

      it('should return false if the drive is large enough and is a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.join(this.mountpoint, 'rpi.img'),
          size: {
            original: 2000000000,
            final: {
              estimation: false,
              value: 2000000000
            }
          }
        })).to.be.false;
      });

      it('should return true if the drive is large enough and is not a source drive', function() {
        m.chai.expect(constraints.isDriveValid(this.drive, {
          path: path.resolve(this.mountpoint, '../bar/rpi.img'),
          size: {
            original: 2000000000,
            final: {
              estimation: false,
              value: 2000000000
            }
          }
        })).to.be.true;
      });

    });

  });

  describe('.getDriveImageCompatibilityStatuses', function() {

    beforeEach(function() {
      if (process.platform === 'win32') {
        this.mountpoint = 'E:';
        this.separator = '\\';
      } else {
        this.mountpoint = '/mnt/foo';
        this.separator = '/';
      }

      this.drive = {
        device: '/dev/disk2',
        name: 'My Drive',
        protected: false,
        system: false,
        mountpoints: [
          {
            path: this.mountpoint
          }
        ],
        size: 4000000000
      };

      this.image = {
        path: path.join(__dirname, 'rpi.img'),
        size: {
          original: this.drive.size - 1,
          final: {
            estimation: false
          }
        }
      };
    });

    const expectStatusTypesAndMessagesToBe = (resultList, expectedTuples) => {

      // Sort so that order doesn't matter
      const expectedTuplesSorted = _.sortBy(_.map(expectedTuples, (tuple) => {
        return {
          type: constraints.COMPATIBILITY_STATUS_TYPES[tuple[0]],
          message: constraints.COMPATIBILITY_STATUS_MESSAGES[tuple[1]]
        };
      }), [ 'message' ]);
      const resultTuplesSorted = _.sortBy(resultList, [ 'message' ]);

      m.chai.expect(resultTuplesSorted).to.deep.equal(expectedTuplesSorted);
    };

    describe('given there are no errors or warnings', () => {

      it('should return an empty list', function() {
        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, {
          path: '/mnt/disk2/rpi.img',
          size: 1000000000
        });

        m.chai.expect(result).to.deep.equal([]);
      });

    });

    describe('given the drive contains the image', () => {

      it('should return the contains-image error', function() {
        this.image.path = `${this.mountpoint}${this.separator}rpi.img`;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'ERROR', 'CONTAINS_IMAGE' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given the drive is a system drive', () => {

      it('should return the system drive warning', function() {
        this.drive.system = true;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'WARNING', 'SYSTEM' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given the drive is too small', () => {

      it('should return the too small error', function() {
        this.image.size.final.value = this.drive.size + 1;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'ERROR', 'TOO_SMALL' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given the drive is locked', () => {

      it('should return the locked drive error', function() {
        this.drive.protected = true;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'ERROR', 'LOCKED' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given the drive is smaller than the recommended size', () => {

      it('should return the smaller than recommended size warning', function() {
        this.image.recommendedDriveSize = this.drive.size + 1;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'WARNING', 'SIZE_NOT_RECOMMENDED' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given the image is null', () => {

      it('should return an empty list', function() {
        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, null);

        m.chai.expect(result).to.deep.equal([]);
      });

    });

    describe('given the drive is null', () => {

      it('should return an empty list', function() {
        const result = constraints.getDriveImageCompatibilityStatuses(null, this.image);

        m.chai.expect(result).to.deep.equal([]);
      });

    });

    describe('given a locked drive and image is null', () => {

      it('should return locked drive error', function() {
        this.drive.protected = true;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, null);
        const expectedTuples = [ [ 'ERROR', 'LOCKED' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given a system drive and image is null', () => {

      it('should return system drive warning', function() {
        this.drive.system = true;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, null);
        const expectedTuples = [ [ 'WARNING', 'SYSTEM' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given the drive contains the image and the drive is locked', () => {

      it('should return the contains-image drive error by precedence', function() {
        this.drive.protected = true;
        this.image.path = `${this.mountpoint}${this.separator}rpi.img`;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'ERROR', 'CONTAINS_IMAGE' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given a locked and too small drive', () => {

      it('should return the locked error by precedence', function() {
        this.drive.protected = true;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'ERROR', 'LOCKED' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given a too small and system drive', () => {

      it('should return the too small drive error by precedence', function() {
        this.image.size.final.value = this.drive.size + 1;
        this.drive.system = true;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'ERROR', 'TOO_SMALL' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });

    describe('given a system drive and not recommended drive size', () => {

      it('should return both warnings', function() {
        this.drive.system = true;
        this.image.recommendedDriveSize = this.drive.size + 1;

        const result = constraints.getDriveImageCompatibilityStatuses(this.drive, this.image);
        const expectedTuples = [ [ 'WARNING', 'SIZE_NOT_RECOMMENDED' ], [ 'WARNING', 'SYSTEM' ] ];

        expectStatusTypesAndMessagesToBe(result, expectedTuples);
      });

    });
  });

});
