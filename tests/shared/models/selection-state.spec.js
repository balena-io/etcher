/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const m = require('mochainon');
const _ = require('lodash');
const path = require('path');
const availableDrives = require('../../../lib/shared/models/available-drives');
const selectionState = require('../../../lib/shared/models/selection-state');

describe('Model: selectionState', function() {

  describe('given a clean state', function() {

    beforeEach(function() {
      selectionState.clear();
    });

    it('getDrive() should return undefined', function() {
      const drive = selectionState.getDrive();
      m.chai.expect(drive).to.be.undefined;
    });

    it('getImage() should return undefined', function() {
      m.chai.expect(selectionState.getImage()).to.be.undefined;
    });

    it('getImagePath() should return undefined', function() {
      m.chai.expect(selectionState.getImagePath()).to.be.undefined;
    });

    it('getImageSize() should return undefined', function() {
      m.chai.expect(selectionState.getImageSize()).to.be.undefined;
    });

    it('getImageUrl() should return undefined', function() {
      m.chai.expect(selectionState.getImageUrl()).to.be.undefined;
    });

    it('getImageName() should return undefined', function() {
      m.chai.expect(selectionState.getImageName()).to.be.undefined;
    });

    it('getImageLogo() should return undefined', function() {
      m.chai.expect(selectionState.getImageLogo()).to.be.undefined;
    });

    it('getImageSupportUrl() should return undefined', function() {
      m.chai.expect(selectionState.getImageSupportUrl()).to.be.undefined;
    });

    it('getImageRecommendedDriveSize() should return undefined', function() {
      m.chai.expect(selectionState.getImageRecommendedDriveSize()).to.be.undefined;
    });

    it('hasDrive() should return false', function() {
      const hasDrive = selectionState.hasDrive();
      m.chai.expect(hasDrive).to.be.false;
    });

    it('hasImage() should return false', function() {
      const hasImage = selectionState.hasImage();
      m.chai.expect(hasImage).to.be.false;
    });

  });

  describe('given a drive', function() {

    beforeEach(function() {
      availableDrives.setDrives([
        {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 999999999,
          protected: false
        },
        {
          device: '/dev/disk5',
          name: 'USB Drive',
          size: 999999999,
          protected: false
        }
      ]);

      selectionState.setDrive('/dev/disk2');
    });

    describe('.getDrive()', function() {

      it('should return the drive', function() {
        const drive = selectionState.getDrive();
        m.chai.expect(drive).to.deep.equal({
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 999999999,
          protected: false
        });
      });

    });

    describe('.hasDrive()', function() {

      it('should return true', function() {
        const hasDrive = selectionState.hasDrive();
        m.chai.expect(hasDrive).to.be.true;
      });

    });

    describe('.setDrive()', function() {

      it('should override the drive', function() {
        selectionState.setDrive('/dev/disk5');
        const drive = selectionState.getDrive();
        m.chai.expect(drive).to.deep.equal({
          device: '/dev/disk5',
          name: 'USB Drive',
          size: 999999999,
          protected: false
        });
      });

    });

    describe('.removeDrive()', function() {

      it('should clear the drive', function() {
        selectionState.removeDrive();
        const drive = selectionState.getDrive();
        m.chai.expect(drive).to.be.undefined;
      });

    });

  });

  describe('given no drive', function() {

    describe('.setDrive()', function() {

      it('should be able to set a drive', function() {
        availableDrives.setDrives([
          {
            device: '/dev/disk5',
            name: 'USB Drive',
            size: 999999999,
            protected: false
          }
        ]);

        selectionState.setDrive('/dev/disk5');
        const drive = selectionState.getDrive();
        m.chai.expect(drive).to.deep.equal({
          device: '/dev/disk5',
          name: 'USB Drive',
          size: 999999999,
          protected: false
        });
      });

      it('should throw if drive is write protected', function() {
        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 999999999,
            protected: true
          }
        ]);

        m.chai.expect(function() {
          selectionState.setDrive('/dev/disk1');
        }).to.throw('The drive is write-protected');
      });

      it('should throw if the drive is not available', function() {
        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 999999999,
            protected: true
          }
        ]);

        m.chai.expect(function() {
          selectionState.setDrive('/dev/disk5');
        }).to.throw('The drive is not available: /dev/disk5');
      });

      it('should throw if device is not a string', function() {
        m.chai.expect(function() {
          selectionState.setDrive(123);
        }).to.throw('Invalid drive: 123');
      });

    });

  });

  describe('given an image', function() {

    beforeEach(function() {
      this.image = {
        path: 'foo.img',
        extension: 'img',
        size: {
          original: 999999999,
          final: {
            estimation: false,
            value: 999999999
          }
        },
        recommendedDriveSize: 1000000000,
        url: 'https://www.raspbian.org',
        supportUrl: 'https://www.raspbian.org/forums/',
        name: 'Raspbian',
        logo: '<svg><text fill="red">Raspbian</text></svg>'
      };

      selectionState.setImage(this.image);
    });

    describe('.setDrive()', function() {

      it('should throw if drive is not large enough', function() {
        availableDrives.setDrives([
          {
            device: '/dev/disk2',
            name: 'USB Drive',
            size: 999999998,
            protected: false
          }
        ]);

        m.chai.expect(function() {
          selectionState.setDrive('/dev/disk2');
        }).to.throw('The drive is not large enough');
      });

    });

    describe('.getImage()', function() {

      it('should return the image', function() {
        m.chai.expect(selectionState.getImage()).to.deep.equal(this.image);
      });

    });

    describe('.getImagePath()', function() {

      it('should return the image path', function() {
        const imagePath = selectionState.getImagePath();
        m.chai.expect(imagePath).to.equal('foo.img');
      });

    });

    describe('.getImageSize()', function() {

      it('should return the image size', function() {
        const imageSize = selectionState.getImageSize();
        m.chai.expect(imageSize).to.equal(999999999);
      });

    });

    describe('.getImageUrl()', function() {

      it('should return the image url', function() {
        const imageUrl = selectionState.getImageUrl();
        m.chai.expect(imageUrl).to.equal('https://www.raspbian.org');
      });

    });

    describe('.getImageName()', function() {

      it('should return the image name', function() {
        const imageName = selectionState.getImageName();
        m.chai.expect(imageName).to.equal('Raspbian');
      });

    });

    describe('.getImageLogo()', function() {

      it('should return the image logo', function() {
        const imageLogo = selectionState.getImageLogo();
        m.chai.expect(imageLogo).to.equal('<svg><text fill="red">Raspbian</text></svg>');
      });

    });

    describe('.getImageSupportUrl()', function() {

      it('should return the image support url', function() {
        const imageSupportUrl = selectionState.getImageSupportUrl();
        m.chai.expect(imageSupportUrl).to.equal('https://www.raspbian.org/forums/');
      });

    });

    describe('.getImageRecommendedDriveSize()', function() {

      it('should return the image recommended drive size', function() {
        const imageRecommendedDriveSize = selectionState.getImageRecommendedDriveSize();
        m.chai.expect(imageRecommendedDriveSize).to.equal(1000000000);
      });

    });

    describe('.hasImage()', function() {

      it('should return true', function() {
        const hasImage = selectionState.hasImage();
        m.chai.expect(hasImage).to.be.true;
      });

    });

    describe('.setImage()', function() {

      it('should override the image', function() {
        selectionState.setImage({
          path: 'bar.img',
          extension: 'img',
          size: {
            original: 999999999,
            final: {
              estimation: false,
              value: 999999999
            }
          }
        });

        const imagePath = selectionState.getImagePath();
        m.chai.expect(imagePath).to.equal('bar.img');
        const imageSize = selectionState.getImageSize();
        m.chai.expect(imageSize).to.equal(999999999);
      });

    });

    describe('.removeImage()', function() {

      it('should clear the image', function() {
        selectionState.removeImage();

        const imagePath = selectionState.getImagePath();
        m.chai.expect(imagePath).to.be.undefined;
        const imageSize = selectionState.getImageSize();
        m.chai.expect(imageSize).to.be.undefined;
      });

    });

  });

  describe('given no image', function() {

    describe('.setImage()', function() {

      it('should be able to set an image', function() {
        selectionState.setImage({
          path: 'foo.img',
          extension: 'img',
          size: {
            original: 999999999,
            final: {
              estimation: false,
              value: 999999999
            }
          }
        });

        const imagePath = selectionState.getImagePath();
        m.chai.expect(imagePath).to.equal('foo.img');
        const imageSize = selectionState.getImageSize();
        m.chai.expect(imageSize).to.equal(999999999);
      });

      it('should be able to set an image with an archive extension', function() {
        selectionState.setImage({
          path: 'foo.zip',
          extension: 'img',
          archiveExtension: 'zip',
          size: {
            original: 999999999,
            final: {
              estimation: false,
              value: 999999999
            }
          }
        });

        const imagePath = selectionState.getImagePath();
        m.chai.expect(imagePath).to.equal('foo.zip');
      });

      it('should throw if no path', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Missing image path');
      });

      it('should throw if path is not a string', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 123,
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid image path: 123');
      });

      it('should throw if no extension', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Missing image extension');
      });

      it('should throw if extension is not a string', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 1,
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid image extension: 1');
      });

      it('should throw if the extension doesn\'t match the path and there is no archive extension', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'iso',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Missing image archive extension');
      });

      it('should throw if the extension doesn\'t match the path and the archive extension is not a string', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'iso',
            archiveExtension: 1,
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid image archive extension: 1');
      });

      it('should throw if the archive extension doesn\'t match the last path extension in a compressed image', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img.xz',
            extension: 'img',
            archiveExtension: 'gz',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Image archive extension mismatch: gz and xz');
      });

      it('should throw if the extension is not recognised in an uncompressed image', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.ifg',
            extension: 'ifg',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid image extension: ifg');
      });

      it('should throw if the extension is not recognised in a compressed image', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.ifg.gz',
            extension: 'ifg',
            archiveExtension: 'gz',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid image extension: ifg');
      });

      it('should throw if the archive extension is not recognised', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img.ifg',
            extension: 'img',
            archiveExtension: 'ifg',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid image archive extension: ifg');
      });

      it('should throw if no size', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img'
          });
        }).to.throw('Missing image size');
      });

      it('should throw if size is not a plain object', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: 999999999
          });
        }).to.throw('Invalid image size: 999999999');
      });

      it('should throw if the original size is not a number', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: '999999999',
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid original image size: 999999999');
      });

      it('should throw if the original size is a float number', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: 999999999.999,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid original image size: 999999999.999');
      });

      it('should throw if the original size is negative', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: -1,
              final: {
                estimation: false,
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid original image size: -1');
      });

      it('should throw if the final size is not a number', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: '999999999'
              }
            }
          });
        }).to.throw('Invalid final image size: 999999999');
      });

      it('should throw if the final size is a float number', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999.999
              }
            }
          });
        }).to.throw('Invalid final image size: 999999999.999');
      });

      it('should throw if the final size is negative', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: -1
              }
            }
          });
        }).to.throw('Invalid final image size: -1');
      });

      it('should throw if the final size estimation flag is not a boolean', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: 'false',
                value: 999999999
              }
            }
          });
        }).to.throw('Invalid final image size estimation flag: false');
      });

      it('should throw if url is defined but it\'s not a string', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            },
            url: 1234
          });
        }).to.throw('Invalid image url: 1234');
      });

      it('should throw if name is defined but it\'s not a string', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            },
            name: 1234
          });
        }).to.throw('Invalid image name: 1234');
      });

      it('should throw if logo is defined but it\'s not a string', function() {
        m.chai.expect(function() {
          selectionState.setImage({
            path: 'foo.img',
            extension: 'img',
            size: {
              original: 999999999,
              final: {
                estimation: false,
                value: 999999999
              }
            },
            logo: 1234
          });
        }).to.throw('Invalid image logo: 1234');
      });

      it('should de-select a previously selected not-large-enough drive', function() {
        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 999999999,
            protected: false
          }
        ]);

        selectionState.setDrive('/dev/disk1');
        m.chai.expect(selectionState.hasDrive()).to.be.true;

        selectionState.setImage({
          path: 'foo.img',
          extension: 'img',
          size: {
            original: 9999999999,
            final: {
              estimation: false,
              value: 9999999999
            }
          }
        });

        m.chai.expect(selectionState.hasDrive()).to.be.false;
        selectionState.removeImage();
      });

      it('should de-select a previously selected not-recommended drive', function() {
        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 1200000000,
            protected: false
          }
        ]);

        selectionState.setDrive('/dev/disk1');
        m.chai.expect(selectionState.hasDrive()).to.be.true;

        selectionState.setImage({
          path: 'foo.img',
          extension: 'img',
          size: {
            original: 999999999,
            final: {
              estimation: false,
              value: 999999999
            }
          },
          recommendedDriveSize: 1500000000
        });

        m.chai.expect(selectionState.hasDrive()).to.be.false;
        selectionState.removeImage();
      });

      it('should de-select a previously selected source drive', function() {
        const imagePath = _.attempt(() => {
          if (process.platform === 'win32') {
            return 'E:\\bar\\foo.img';
          }

          return '/mnt/bar/foo.img';
        });

        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 1200000000,
            mountpoints: [
              {
                path: path.dirname(imagePath)
              }
            ],
            protected: false
          }
        ]);

        selectionState.setDrive('/dev/disk1');
        m.chai.expect(selectionState.hasDrive()).to.be.true;

        selectionState.setImage({
          path: imagePath,
          extension: 'img',
          size: {
            original: 999999999,
            final: {
              estimation: false,
              value: 999999999
            }
          }
        });

        m.chai.expect(selectionState.hasDrive()).to.be.false;
        selectionState.removeImage();
      });

    });

  });

  describe('given a drive', function() {

    beforeEach(function() {
      availableDrives.setDrives([
        {
          device: '/dev/disk1',
          name: 'USB Drive',
          size: 999999999,
          protected: false
        }
      ]);

      selectionState.setDrive('/dev/disk1');

      selectionState.setImage({
        path: 'foo.img',
        extension: 'img',
        size: {
          original: 999999999,
          final: {
            estimation: false,
            value: 999999999
          }
        }
      });
    });

    describe('.clear()', function() {

      it('should clear all selections', function() {
        m.chai.expect(selectionState.hasDrive()).to.be.true;
        m.chai.expect(selectionState.hasImage()).to.be.true;

        selectionState.clear();

        m.chai.expect(selectionState.hasDrive()).to.be.false;
        m.chai.expect(selectionState.hasImage()).to.be.false;
      });

    });

    describe('given the preserveImage option', function() {

      beforeEach(function() {
        selectionState.clear({
          preserveImage: true
        });
      });

      it('getDrive() should return undefined', function() {
        const drive = selectionState.getDrive();
        m.chai.expect(drive).to.be.undefined;
      });

      it('getImagePath() should return the image path', function() {
        const imagePath = selectionState.getImagePath();
        m.chai.expect(imagePath).to.equal('foo.img');
      });

      it('getImageSize() should return the image size', function() {
        const imageSize = selectionState.getImageSize();
        m.chai.expect(imageSize).to.equal(999999999);
      });

      it('hasDrive() should return false', function() {
        const hasDrive = selectionState.hasDrive();
        m.chai.expect(hasDrive).to.be.false;
      });

      it('hasImage() should return true', function() {
        const hasImage = selectionState.hasImage();
        m.chai.expect(hasImage).to.be.true;
      });

    });

  });

  describe('.isCurrentDrive()', function() {

    describe('given a selected drive', function() {

      beforeEach(function() {
        availableDrives.setDrives([
          {
            device: '/dev/sdb',
            description: 'DataTraveler 2.0',
            size: 999999999,
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false,
            protected: false
          }
        ]);

        selectionState.setDrive('/dev/sdb');
      });

      it('should return false if an undefined value is passed', function() {
        m.chai.expect(selectionState.isCurrentDrive()).to.be.false;
      });

      it('should return true given the exact same drive', function() {
        m.chai.expect(selectionState.isCurrentDrive('/dev/sdb')).to.be.true;
      });

      it('should return false if it is not the current drive', function() {
        m.chai.expect(selectionState.isCurrentDrive('/dev/sdc')).to.be.false;
      });

    });

    describe('given no selected drive', function() {

      beforeEach(function() {
        selectionState.removeDrive();
      });

      it('should return false if an undefined value is passed', function() {
        m.chai.expect(selectionState.isCurrentDrive()).to.be.false;
      });

      it('should return false for anything', function() {
        m.chai.expect(selectionState.isCurrentDrive('/dev/sdb')).to.be.false;
      });

    });

  });

  describe('.toggleSetDrive()', function() {

    describe('given a selected drive', function() {

      beforeEach(function() {
        this.drive = {
          device: '/dev/sdb',
          description: 'DataTraveler 2.0',
          size: 999999999,
          mountpoint: '/media/UNTITLED',
          name: '/dev/sdb',
          system: false,
          protected: false
        };

        availableDrives.setDrives([
          this.drive,
          {
            device: '/dev/disk2',
            name: 'USB Drive',
            size: 999999999,
            protected: false
          }
        ]);

        selectionState.setDrive(this.drive.device);
      });

      it('should be able to remove the drive', function() {
        m.chai.expect(selectionState.hasDrive()).to.be.true;
        selectionState.toggleSetDrive(this.drive.device);
        m.chai.expect(selectionState.hasDrive()).to.be.false;
      });

      it('should be able to replace the drive', function() {
        const drive = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 999999999,
          protected: false
        };

        m.chai.expect(selectionState.getDrive()).to.deep.equal(this.drive);
        selectionState.toggleSetDrive(drive.device);
        m.chai.expect(selectionState.getDrive()).to.deep.equal(drive);
        m.chai.expect(selectionState.getDrive()).to.not.deep.equal(this.drive);
      });

    });

    describe('given no selected drive', function() {

      beforeEach(function() {
        selectionState.removeDrive();
      });

      it('should set the drive', function() {
        const drive = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 999999999,
          protected: false
        };

        m.chai.expect(selectionState.hasDrive()).to.be.false;
        selectionState.toggleSetDrive(drive.device);
        m.chai.expect(selectionState.getDrive()).to.deep.equal(drive);
      });

    });

  });

});
