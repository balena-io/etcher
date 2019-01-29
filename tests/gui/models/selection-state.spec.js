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

'use strict'

const m = require('mochainon')
const _ = require('lodash')
const path = require('path')
const availableDrives = require('../../../lib/gui/app/models/available-drives')
const selectionState = require('../../../lib/gui/app/models/selection-state')

describe('Model: selectionState', function () {
  describe('given a clean state', function () {
    beforeEach(function () {
      selectionState.clear()
    })

    it('getCurrentDrive() should return undefined', function () {
      const drive = selectionState.getCurrentDrive()
      m.chai.expect(drive).to.be.undefined
    })

    it('getImage() should return undefined', function () {
      m.chai.expect(selectionState.getImage()).to.be.undefined
    })

    it('getImagePath() should return undefined', function () {
      m.chai.expect(selectionState.getImagePath()).to.be.undefined
    })

    it('getImageSize() should return undefined', function () {
      m.chai.expect(selectionState.getImageSize()).to.be.undefined
    })

    it('getImageUrl() should return undefined', function () {
      m.chai.expect(selectionState.getImageUrl()).to.be.undefined
    })

    it('getImageName() should return undefined', function () {
      m.chai.expect(selectionState.getImageName()).to.be.undefined
    })

    it('getImageLogo() should return undefined', function () {
      m.chai.expect(selectionState.getImageLogo()).to.be.undefined
    })

    it('getImageSupportUrl() should return undefined', function () {
      m.chai.expect(selectionState.getImageSupportUrl()).to.be.undefined
    })

    it('getImageRecommendedDriveSize() should return undefined', function () {
      m.chai.expect(selectionState.getImageRecommendedDriveSize()).to.be.undefined
    })

    it('hasDrive() should return false', function () {
      const hasDrive = selectionState.hasDrive()
      m.chai.expect(hasDrive).to.be.false
    })

    it('hasImage() should return false', function () {
      const hasImage = selectionState.hasImage()
      m.chai.expect(hasImage).to.be.false
    })

    it('.getSelectedDrives() should return []', function () {
      m.chai.expect(selectionState.getSelectedDrives()).to.deep.equal([])
    })
  })

  describe('given one available drive', function () {
    beforeEach(function () {
      this.drives = [
        {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 999999999,
          isReadOnly: false
        }
      ]
    })

    afterEach(function () {
      selectionState.clear()
      availableDrives.setDrives([])
    })

    describe('.selectDrive()', function () {
      it('should not deselect when warning is attached to image-drive pair', function () {
        this.drives[0].size = 64e10

        availableDrives.setDrives(this.drives)
        selectionState.selectDrive('/dev/disk2')
        availableDrives.setDrives(this.drives)
        m.chai.expect(selectionState.getCurrentDrive()).to.deep.equal({
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 64e10,
          isReadOnly: false
        })
      })
    })
  })

  describe('given a drive', function () {
    beforeEach(function () {
      availableDrives.setDrives([
        {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 999999999,
          isReadOnly: false
        },
        {
          device: '/dev/disk5',
          name: 'USB Drive',
          size: 999999999,
          isReadOnly: false
        }
      ])

      selectionState.selectDrive('/dev/disk2')
    })

    afterEach(function () {
      selectionState.clear()
    })

    describe('.getCurrentDrive()', function () {
      it('should return the drive', function () {
        const drive = selectionState.getCurrentDrive()
        m.chai.expect(drive).to.deep.equal({
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 999999999,
          isReadOnly: false
        })
      })
    })

    describe('.hasDrive()', function () {
      it('should return true', function () {
        const hasDrive = selectionState.hasDrive()
        m.chai.expect(hasDrive).to.be.true
      })
    })

    describe('.selectDrive()', function () {
      it('should queue the drive', function () {
        selectionState.selectDrive('/dev/disk5')
        const drives = selectionState.getSelectedDevices()
        const lastDriveDevice = _.last(drives)
        const lastDrive = _.find(availableDrives.getDrives(), { device: lastDriveDevice })
        m.chai.expect(lastDrive).to.deep.equal({
          device: '/dev/disk5',
          name: 'USB Drive',
          size: 999999999,
          isReadOnly: false
        })
      })
    })

    describe('.deselectDrive()', function () {
      it('should clear drive', function () {
        const firstDrive = selectionState.getCurrentDrive()
        selectionState.deselectDrive(firstDrive.device)
        const drive = selectionState.getCurrentDrive()
        m.chai.expect(drive).to.be.undefined
      })
    })

    describe('.getSelectedDrives()', function () {
      it('should return that single selected drive', function () {
        m.chai.expect(selectionState.getSelectedDrives()).to.deep.equal([
          {
            device: '/dev/disk2',
            name: 'USB Drive',
            size: 999999999,
            isReadOnly: false
          }
        ])
      })
    })
  })

  describe('given several drives', function () {
    beforeEach(function () {
      this.drives = [
        {
          device: '/dev/sdb',
          description: 'DataTraveler 2.0',
          size: 999999999,
          mountpoint: '/media/UNTITLED',
          name: '/dev/sdb',
          system: false,
          isReadOnly: false
        },
        {
          device: '/dev/disk2',
          name: 'USB Drive 2',
          size: 999999999,
          isReadOnly: false
        },
        {
          device: '/dev/disk3',
          name: 'USB Drive 3',
          size: 999999999,
          isReadOnly: false
        }
      ]

      availableDrives.setDrives(this.drives)

      selectionState.selectDrive(this.drives[0].device)
      selectionState.selectDrive(this.drives[1].device)
    })

    afterEach(function () {
      selectionState.clear()
      availableDrives.setDrives([])
    })

    it('should be able to add more drives', function () {
      selectionState.selectDrive(this.drives[2].device)
      m.chai.expect(selectionState.getSelectedDevices()).to.deep.equal(_.map(this.drives, 'device'))
    })

    it('should be able to remove drives', function () {
      selectionState.deselectDrive(this.drives[1].device)
      m.chai.expect(selectionState.getSelectedDevices()).to.deep.equal([ this.drives[0].device ])
    })

    it('current drive should be affected by add order', function () {
      m.chai.expect(selectionState.getCurrentDrive()).to.deep.equal(this.drives[0])
      selectionState.toggleDrive(this.drives[0].device)
      selectionState.toggleDrive(this.drives[0].device)
      m.chai.expect(selectionState.getCurrentDrive()).to.deep.equal(this.drives[1])
    })

    it('should keep system drives selected', function () {
      const systemDrive = {
        device: '/dev/disk0',
        name: 'USB Drive 0',
        size: 999999999,
        isReadOnly: false,
        system: true
      }

      const newDrives = [ ..._.initial(this.drives), systemDrive ]
      availableDrives.setDrives(newDrives)

      selectionState.selectDrive(systemDrive.device)
      availableDrives.setDrives(newDrives)
      m.chai.expect(selectionState.getSelectedDevices()).to.deep.equal(_.map(newDrives, 'device'))
    })

    it('should be able to remove a drive', function () {
      m.chai.expect(selectionState.getSelectedDevices().length).to.equal(2)
      selectionState.toggleDrive(this.drives[0].device)
      m.chai.expect(selectionState.getSelectedDevices()).to.deep.equal([ this.drives[1].device ])
    })

    describe('.deselectAllDrives()', function () {
      it('should remove all drives', function () {
        selectionState.deselectAllDrives()
        m.chai.expect(selectionState.getSelectedDevices()).to.deep.equal([])
      })
    })

    describe('.deselectOtherDrives()', function () {
      it('should deselect other drives', function () {
        selectionState.deselectOtherDrives(this.drives[0].device)
        m.chai.expect(selectionState.getSelectedDevices()).to.not.include.members([ this.drives[1].device ])
      })

      it('should not remove the specified drive', function () {
        selectionState.deselectOtherDrives(this.drives[0].device)
        m.chai.expect(selectionState.getSelectedDevices()).to.deep.equal([ this.drives[0].device ])
      })
    })

    describe('.deselectDrive()', function () {
      it('should clear drives', function () {
        const firstDrive = selectionState.getCurrentDrive()
        selectionState.deselectDrive(firstDrive.device)
        const secondDrive = selectionState.getCurrentDrive()
        selectionState.deselectDrive(secondDrive.device)
        const drive = selectionState.getCurrentDrive()
        m.chai.expect(drive).to.be.undefined
      })
    })

    describe('.getSelectedDrives()', function () {
      it('should return the selected drives', function () {
        m.chai.expect(selectionState.getSelectedDrives()).to.deep.equal([
          {
            device: '/dev/sdb',
            description: 'DataTraveler 2.0',
            size: 999999999,
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false,
            isReadOnly: false
          },
          {
            device: '/dev/disk2',
            name: 'USB Drive 2',
            size: 999999999,
            isReadOnly: false
          }
        ])
      })
    })
  })

  describe('given no drive', function () {
    describe('.selectDrive()', function () {
      it('should be able to set a drive', function () {
        availableDrives.setDrives([
          {
            device: '/dev/disk5',
            name: 'USB Drive',
            size: 999999999,
            isReadOnly: false
          }
        ])

        selectionState.selectDrive('/dev/disk5')
        const drive = selectionState.getCurrentDrive()
        m.chai.expect(drive).to.deep.equal({
          device: '/dev/disk5',
          name: 'USB Drive',
          size: 999999999,
          isReadOnly: false
        })
      })

      it('should throw if drive is read-only', function () {
        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 999999999,
            isReadOnly: true
          }
        ])

        m.chai.expect(function () {
          selectionState.selectDrive('/dev/disk1')
        }).to.throw('The drive is write-protected')
      })

      it('should throw if the drive is not available', function () {
        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 999999999,
            isReadOnly: true
          }
        ])

        m.chai.expect(function () {
          selectionState.selectDrive('/dev/disk5')
        }).to.throw('The drive is not available: /dev/disk5')
      })

      it('should throw if device is not a string', function () {
        m.chai.expect(function () {
          selectionState.selectDrive(123)
        }).to.throw('Invalid drive: 123')
      })
    })
  })

  describe('given an image', function () {
    beforeEach(function () {
      this.image = {
        path: 'foo.img',
        extension: 'img',
        size: 999999999,
        recommendedDriveSize: 1000000000,
        url: 'https://www.raspbian.org',
        supportUrl: 'https://www.raspbian.org/forums/',
        name: 'Raspbian',
        logo: '<svg><text fill="red">Raspbian</text></svg>'
      }

      selectionState.selectImage(this.image)
    })

    describe('.selectDrive()', function () {
      it('should throw if drive is not large enough', function () {
        availableDrives.setDrives([
          {
            device: '/dev/disk2',
            name: 'USB Drive',
            size: 999999998,
            isReadOnly: false
          }
        ])

        m.chai.expect(function () {
          selectionState.selectDrive('/dev/disk2')
        }).to.throw('The drive is not large enough')
      })
    })

    describe('.getImage()', function () {
      it('should return the image', function () {
        m.chai.expect(selectionState.getImage()).to.deep.equal(this.image)
      })
    })

    describe('.getImagePath()', function () {
      it('should return the image path', function () {
        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.equal('foo.img')
      })
    })

    describe('.getImageSize()', function () {
      it('should return the image size', function () {
        const imageSize = selectionState.getImageSize()
        m.chai.expect(imageSize).to.equal(999999999)
      })
    })

    describe('.getImageUrl()', function () {
      it('should return the image url', function () {
        const imageUrl = selectionState.getImageUrl()
        m.chai.expect(imageUrl).to.equal('https://www.raspbian.org')
      })
    })

    describe('.getImageName()', function () {
      it('should return the image name', function () {
        const imageName = selectionState.getImageName()
        m.chai.expect(imageName).to.equal('Raspbian')
      })
    })

    describe('.getImageLogo()', function () {
      it('should return the image logo', function () {
        const imageLogo = selectionState.getImageLogo()
        m.chai.expect(imageLogo).to.equal('<svg><text fill="red">Raspbian</text></svg>')
      })
    })

    describe('.getImageSupportUrl()', function () {
      it('should return the image support url', function () {
        const imageSupportUrl = selectionState.getImageSupportUrl()
        m.chai.expect(imageSupportUrl).to.equal('https://www.raspbian.org/forums/')
      })
    })

    describe('.getImageRecommendedDriveSize()', function () {
      it('should return the image recommended drive size', function () {
        const imageRecommendedDriveSize = selectionState.getImageRecommendedDriveSize()
        m.chai.expect(imageRecommendedDriveSize).to.equal(1000000000)
      })
    })

    describe('.hasImage()', function () {
      it('should return true', function () {
        const hasImage = selectionState.hasImage()
        m.chai.expect(hasImage).to.be.true
      })
    })

    describe('.selectImage()', function () {
      it('should override the image', function () {
        selectionState.selectImage({
          path: 'bar.img',
          extension: 'img',
          size: 999999999,
          isSizeEstimated: false
        })

        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.equal('bar.img')
        const imageSize = selectionState.getImageSize()
        m.chai.expect(imageSize).to.equal(999999999)
      })
    })

    describe('.deselectImage()', function () {
      it('should clear the image', function () {
        selectionState.deselectImage()

        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.be.undefined
        const imageSize = selectionState.getImageSize()
        m.chai.expect(imageSize).to.be.undefined
      })
    })
  })

  describe('given no image', function () {
    describe('.selectImage()', function () {
      afterEach(selectionState.clear)

      it('should be able to set an image', function () {
        selectionState.selectImage({
          path: 'foo.img',
          extension: 'img',
          size: 999999999,
          isSizeEstimated: false
        })

        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.equal('foo.img')
        const imageSize = selectionState.getImageSize()
        m.chai.expect(imageSize).to.equal(999999999)
      })

      it('should be able to set an image with an archive extension', function () {
        selectionState.selectImage({
          path: 'foo.zip',
          extension: 'img',
          archiveExtension: 'zip',
          size: 999999999,
          isSizeEstimated: false
        })

        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.equal('foo.zip')
      })

      it('should infer a compressed raw image if the penultimate extension is missing', function () {
        selectionState.selectImage({
          path: 'foo.xz',
          extension: 'img',
          archiveExtension: 'xz',
          size: 999999999,
          isSizeEstimated: false
        })

        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.equal('foo.xz')
      })

      it('should infer a compressed raw image if the penultimate extension is not a file extension', function () {
        selectionState.selectImage({
          path: 'something.linux-x86-64.gz',
          extension: 'img',
          archiveExtension: 'gz',
          size: 999999999,
          isSizeEstimated: false
        })

        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.equal('something.linux-x86-64.gz')
      })

      it('should throw if no path', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            extension: 'img',
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Missing image fields: path')
      })

      it('should throw if path is not a string', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 123,
            extension: 'img',
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image path: 123')
      })

      it('should throw if no extension', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Missing image fields: extension')
      })

      it('should throw if extension is not a string', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 1,
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image extension: 1')
      })

      it('should throw if the extension doesn\'t match the path and there is no archive extension', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'iso',
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Missing image archive extension')
      })

      it('should throw if the extension doesn\'t match the path and the archive extension is not a string', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'iso',
            archiveExtension: 1,
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Missing image archive extension')
      })

      it('should throw if the archive extension doesn\'t match the last path extension in a compressed image', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img.xz',
            extension: 'img',
            archiveExtension: 'gz',
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Image archive extension mismatch: gz and xz')
      })

      it('should throw if the extension is not recognised in an uncompressed image', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.ifg',
            extension: 'ifg',
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image extension: ifg')
      })

      it('should throw if the extension is not recognised in a compressed image', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.ifg.gz',
            extension: 'ifg',
            archiveExtension: 'gz',
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image extension: ifg')
      })

      it('should throw if the archive extension is not recognised', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img.ifg',
            extension: 'img',
            archiveExtension: 'ifg',
            size: 999999999,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image archive extension: ifg')
      })

      it('should throw if the original size is not a number', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: 999999999,
            compressedSize: '999999999',
            isSizeEstimated: false
          })
        }).to.throw('Invalid image compressed size: 999999999')
      })

      it('should throw if the original size is a float number', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: 999999999,
            compressedSize: 999999999.999,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image compressed size: 999999999.999')
      })

      it('should throw if the original size is negative', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: 999999999,
            compressedSize: -1,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image compressed size: -1')
      })

      it('should throw if the final size is not a number', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: '999999999',
            isSizeEstimated: false
          })
        }).to.throw('Invalid image size: 999999999')
      })

      it('should throw if the final size is a float number', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: 999999999.999,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image size: 999999999.999')
      })

      it('should throw if the final size is negative', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: -1,
            isSizeEstimated: false
          })
        }).to.throw('Invalid image size: -1')
      })

      it('should throw if url is defined but it\'s not a string', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: 999999999,
            isSizeEstimated: false,
            url: 1234
          })
        }).to.throw('Invalid image url: 1234')
      })

      it('should throw if name is defined but it\'s not a string', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: 999999999,
            isSizeEstimated: false,
            name: 1234
          })
        }).to.throw('Invalid image name: 1234')
      })

      it('should throw if logo is defined but it\'s not a string', function () {
        m.chai.expect(function () {
          selectionState.selectImage({
            path: 'foo.img',
            extension: 'img',
            size: 999999999,
            isSizeEstimated: false,
            logo: 1234
          })
        }).to.throw('Invalid image logo: 1234')
      })

      it('should de-select a previously selected not-large-enough drive', function () {
        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 123456789,
            isReadOnly: false
          }
        ])

        selectionState.selectDrive('/dev/disk1')
        m.chai.expect(selectionState.hasDrive()).to.be.true

        selectionState.selectImage({
          path: 'foo.img',
          extension: 'img',
          size: 1234567890,
          isSizeEstimated: false
        })

        m.chai.expect(selectionState.hasDrive()).to.be.false
        selectionState.deselectImage()
      })

      it('should de-select a previously selected not-recommended drive', function () {
        availableDrives.setDrives([
          {
            device: '/dev/disk1',
            name: 'USB Drive',
            size: 1200000000,
            isReadOnly: false
          }
        ])

        selectionState.selectDrive('/dev/disk1')
        m.chai.expect(selectionState.hasDrive()).to.be.true

        selectionState.selectImage({
          path: 'foo.img',
          extension: 'img',
          size: 999999999,
          isSizeEstimated: false,
          recommendedDriveSize: 1500000000
        })

        m.chai.expect(selectionState.hasDrive()).to.be.false
        selectionState.deselectImage()
      })

      it('should de-select a previously selected source drive', function () {
        const imagePath = _.attempt(() => {
          if (process.platform === 'win32') {
            return 'E:\\bar\\foo.img'
          }

          return '/mnt/bar/foo.img'
        })

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
            isReadOnly: false
          }
        ])

        selectionState.selectDrive('/dev/disk1')
        m.chai.expect(selectionState.hasDrive()).to.be.true

        selectionState.selectImage({
          path: imagePath,
          extension: 'img',
          size: 999999999,
          isSizeEstimated: false
        })

        m.chai.expect(selectionState.hasDrive()).to.be.false
        selectionState.deselectImage()
      })
    })
  })

  describe('given a drive and an image', function () {
    beforeEach(function () {
      availableDrives.setDrives([
        {
          device: '/dev/disk1',
          name: 'USB Drive',
          size: 999999999,
          isReadOnly: false
        }
      ])

      selectionState.selectDrive('/dev/disk1')

      selectionState.selectImage({
        path: 'foo.img',
        extension: 'img',
        size: 999999999,
        isSizeEstimated: false
      })
    })

    describe('.clear()', function () {
      it('should clear all selections', function () {
        m.chai.expect(selectionState.hasDrive()).to.be.true
        m.chai.expect(selectionState.hasImage()).to.be.true

        selectionState.clear()

        m.chai.expect(selectionState.hasDrive()).to.be.false
        m.chai.expect(selectionState.hasImage()).to.be.false
      })
    })

    describe('.deselectImage()', function () {
      beforeEach(function () {
        selectionState.deselectImage()
      })

      it('getCurrentDrive() should return the selected drive object', function () {
        const drive = selectionState.getCurrentDrive()
        m.chai.expect(drive).to.deep.equal({
          device: '/dev/disk1',
          isReadOnly: false,
          name: 'USB Drive',
          size: 999999999
        })
      })

      it('getImagePath() should return undefined', function () {
        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.be.undefined
      })

      it('getImageSize() should return undefined', function () {
        const imageSize = selectionState.getImageSize()
        m.chai.expect(imageSize).to.be.undefined
      })

      it('should not clear any drives', function () {
        m.chai.expect(selectionState.hasDrive()).to.be.true
      })

      it('hasImage() should return false', function () {
        const hasImage = selectionState.hasImage()
        m.chai.expect(hasImage).to.be.false
      })
    })

    describe('.deselectAllDrives()', function () {
      beforeEach(function () {
        selectionState.deselectAllDrives()
      })

      it('getCurrentDrive() should return undefined', function () {
        const drive = selectionState.getCurrentDrive()
        m.chai.expect(drive).to.be.undefined
      })

      it('getImagePath() should return the image path', function () {
        const imagePath = selectionState.getImagePath()
        m.chai.expect(imagePath).to.equal('foo.img')
      })

      it('getImageSize() should return the image size', function () {
        const imageSize = selectionState.getImageSize()
        m.chai.expect(imageSize).to.equal(999999999)
      })

      it('hasDrive() should return false', function () {
        const hasDrive = selectionState.hasDrive()
        m.chai.expect(hasDrive).to.be.false
      })

      it('should not clear the image', function () {
        m.chai.expect(selectionState.hasImage()).to.be.true
      })
    })
  })

  describe('given several drives', function () {
    beforeEach(function () {
      availableDrives.setDrives([
        {
          device: '/dev/disk1',
          name: 'USB Drive 1',
          size: 999999999,
          isReadOnly: false
        },
        {
          device: '/dev/disk2',
          name: 'USB Drive 2',
          size: 999999999,
          isReadOnly: false
        },
        {
          device: '/dev/disk3',
          name: 'USB Drive 3',
          size: 999999999,
          isReadOnly: false
        }
      ])

      selectionState.selectDrive('/dev/disk1')
      selectionState.selectDrive('/dev/disk2')
      selectionState.selectDrive('/dev/disk3')

      selectionState.selectImage({
        path: 'foo.img',
        extension: 'img',
        size: 999999999,
        isSizeEstimated: false
      })
    })

    describe('.clear()', function () {
      it('should clear all selections', function () {
        m.chai.expect(selectionState.hasDrive()).to.be.true
        m.chai.expect(selectionState.hasImage()).to.be.true

        selectionState.clear()

        m.chai.expect(selectionState.hasDrive()).to.be.false
        m.chai.expect(selectionState.hasImage()).to.be.false
      })
    })
  })

  describe('.isCurrentDrive()', function () {
    describe('given a selected drive', function () {
      beforeEach(function () {
        availableDrives.setDrives([
          {
            device: '/dev/sdb',
            description: 'DataTraveler 2.0',
            size: 999999999,
            mountpoints: [ {
              path: '/media/UNTITLED'
            } ],
            name: '/dev/sdb',
            isSystem: false,
            isReadOnly: false
          }
        ])

        selectionState.selectDrive('/dev/sdb')
      })

      afterEach(function () {
        selectionState.clear()
        availableDrives.setDrives([])
      })

      it('should return false if an undefined value is passed', function () {
        m.chai.expect(selectionState.isCurrentDrive()).to.be.false
      })

      it('should return true given the exact same drive', function () {
        m.chai.expect(selectionState.isCurrentDrive('/dev/sdb')).to.be.true
      })

      it('should return false if it is not the current drive', function () {
        m.chai.expect(selectionState.isCurrentDrive('/dev/sdc')).to.be.false
      })
    })

    describe('given no selected drive', function () {
      beforeEach(function () {
        selectionState.clear()
      })

      it('should return false if an undefined value is passed', function () {
        m.chai.expect(selectionState.isCurrentDrive()).to.be.false
      })

      it('should return false for anything', function () {
        m.chai.expect(selectionState.isCurrentDrive('/dev/sdb')).to.be.false
      })
    })
  })

  describe('.toggleDrive()', function () {
    describe('given a selected drive', function () {
      beforeEach(function () {
        this.drive = {
          device: '/dev/sdb',
          description: 'DataTraveler 2.0',
          size: 999999999,
          mountpoints: [ {
            path: '/media/UNTITLED'
          } ],
          name: '/dev/sdb',
          isSystem: false,
          isReadOnly: false
        }

        availableDrives.setDrives([
          this.drive,
          {
            device: '/dev/disk2',
            name: 'USB Drive 2',
            size: 999999999,
            isReadOnly: false
          }
        ])

        selectionState.selectDrive(this.drive.device)
      })

      afterEach(function () {
        selectionState.clear()
        availableDrives.setDrives([])
      })

      it('should be able to remove the drive', function () {
        m.chai.expect(selectionState.hasDrive()).to.be.true
        selectionState.toggleDrive(this.drive.device)
        m.chai.expect(selectionState.hasDrive()).to.be.false
      })

      it('should not replace a different drive', function () {
        const drive = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: 999999999,
          isReadOnly: false
        }

        m.chai.expect(selectionState.getCurrentDrive()).to.deep.equal(this.drive)
        selectionState.toggleDrive(drive.device)
        m.chai.expect(selectionState.getCurrentDrive()).to.deep.equal(this.drive)
        m.chai.expect(selectionState.getCurrentDrive()).to.not.deep.equal(drive)
      })
    })

    describe('given no selected drive', function () {
      beforeEach(function () {
        selectionState.clear()

        availableDrives.setDrives([
          {
            device: '/dev/disk2',
            name: 'USB Drive 2',
            size: 999999999,
            isReadOnly: false
          },
          {
            device: '/dev/disk3',
            name: 'USB Drive 3',
            size: 999999999,
            isReadOnly: false
          }
        ])
      })

      afterEach(function () {
        availableDrives.setDrives([])
      })

      it('should set the drive', function () {
        const drive = {
          device: '/dev/disk2',
          name: 'USB Drive 2',
          size: 999999999,
          isReadOnly: false
        }

        m.chai.expect(selectionState.hasDrive()).to.be.false
        selectionState.toggleDrive(drive.device)
        m.chai.expect(selectionState.getCurrentDrive()).to.deep.equal(drive)
      })
    })
  })
})
