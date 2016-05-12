'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');

describe('Browser: SelectionState', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/models/selection-state')
  ));

  describe('SelectionStateModel', function() {

    let SelectionStateModel;

    beforeEach(angular.mock.inject(function(_SelectionStateModel_) {
      SelectionStateModel = _SelectionStateModel_;
    }));

    describe('given a clean state', function() {

      beforeEach(function() {
        SelectionStateModel.clear();
      });

      it('getDrive() should return undefined', function() {
        const drive = SelectionStateModel.getDrive();
        m.chai.expect(drive).to.be.undefined;
      });

      it('getImagePath() should return undefined', function() {
        m.chai.expect(SelectionStateModel.getImagePath()).to.be.undefined;
      });

      it('getImageSize() should return undefined', function() {
        m.chai.expect(SelectionStateModel.getImageSize()).to.be.undefined;
      });

      it('hasDrive() should return false', function() {
        const hasDrive = SelectionStateModel.hasDrive();
        m.chai.expect(hasDrive).to.be.false;
      });

      it('hasImage() should return false', function() {
        const hasImage = SelectionStateModel.hasImage();
        m.chai.expect(hasImage).to.be.false;
      });

    });

    describe('given an empty object drive', function() {

      beforeEach(function() {
        SelectionStateModel.setDrive({});
      });

      describe('.getDrive()', function() {

        it('should return undefined', function() {
          const drive = SelectionStateModel.getDrive();
          m.chai.expect(drive).to.be.undefined;
        });

      });

    });

    describe('given a drive', function() {

      beforeEach(function() {
        SelectionStateModel.setDrive('/dev/disk2');
      });

      describe('.getDrive()', function() {

        it('should return the drive', function() {
          const drive = SelectionStateModel.getDrive();
          m.chai.expect(drive).to.equal('/dev/disk2');
        });

      });

      describe('.hasDrive()', function() {

        it('should return true', function() {
          const hasDrive = SelectionStateModel.hasDrive();
          m.chai.expect(hasDrive).to.be.true;
        });

      });

      describe('.setDrive()', function() {

        it('should override the drive', function() {
          SelectionStateModel.setDrive('/dev/disk5');
          const drive = SelectionStateModel.getDrive();
          m.chai.expect(drive).to.equal('/dev/disk5');
        });

      });

      describe('.removeDrive()', function() {

        it('should clear the drive', function() {
          SelectionStateModel.removeDrive();
          const drive = SelectionStateModel.getDrive();
          m.chai.expect(drive).to.be.undefined;
        });

      });

    });

    describe('given no drive', function() {

      describe('.setDrive()', function() {

        it('should be able to set a drive', function() {
          SelectionStateModel.setDrive('/dev/disk5');
          const drive = SelectionStateModel.getDrive();
          m.chai.expect(drive).to.equal('/dev/disk5');
        });

      });

    });

    describe('given an image', function() {

      beforeEach(function() {
        SelectionStateModel.setImage({
          path: 'foo.img',
          size: 999999999
        });
      });

      describe('.getImagePath()', function() {

        it('should return the image path', function() {
          const imagePath = SelectionStateModel.getImagePath();
          m.chai.expect(imagePath).to.equal('foo.img');
        });

      });

      describe('.getImageSize()', function() {

        it('should return the image size', function() {
          const imageSize = SelectionStateModel.getImageSize();
          m.chai.expect(imageSize).to.equal(999999999);
        });

      });

      describe('.hasImage()', function() {

        it('should return true', function() {
          const hasImage = SelectionStateModel.hasImage();
          m.chai.expect(hasImage).to.be.true;
        });

      });

      describe('.setImage()', function() {

        it('should override the image', function() {
          SelectionStateModel.setImage({
            path: 'bar.img',
            size: 999999999
          });

          const imagePath = SelectionStateModel.getImagePath();
          m.chai.expect(imagePath).to.equal('bar.img');
          const imageSize = SelectionStateModel.getImageSize();
          m.chai.expect(imageSize).to.equal(999999999);
        });

      });

      describe('.removeImage()', function() {

        it('should clear the image', function() {
          SelectionStateModel.removeImage();

          const imagePath = SelectionStateModel.getImagePath();
          m.chai.expect(imagePath).to.be.undefined;
          const imageSize = SelectionStateModel.getImageSize();
          m.chai.expect(imageSize).to.be.undefined;
        });

      });

    });

    describe('given no image', function() {

      describe('.setImage()', function() {

        it('should be able to set an image', function() {
          SelectionStateModel.setImage({
            path: 'foo.img',
            size: 999999999
          });

          const imagePath = SelectionStateModel.getImagePath();
          m.chai.expect(imagePath).to.equal('foo.img');
          const imageSize = SelectionStateModel.getImageSize();
          m.chai.expect(imageSize).to.equal(999999999);
        });

      });

    });

    describe('given a drive', function() {

      beforeEach(function() {
        SelectionStateModel.setDrive('/dev/disk2');

        SelectionStateModel.setImage({
          path: 'foo.img',
          size: 999999999
        });
      });

      describe('.clear()', function() {

        it('should clear all selections', function() {
          m.chai.expect(SelectionStateModel.hasDrive()).to.be.true;
          m.chai.expect(SelectionStateModel.hasImage()).to.be.true;

          SelectionStateModel.clear();

          m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
          m.chai.expect(SelectionStateModel.hasImage()).to.be.false;
        });

      });

      describe('given the preserveImage option', function() {

        beforeEach(function() {
          SelectionStateModel.clear({
            preserveImage: true
          });
        });

        it('getDrive() should return undefined', function() {
          const drive = SelectionStateModel.getDrive();
          m.chai.expect(drive).to.be.undefined;
        });

        it('getImagePath() should return the image path', function() {
          const imagePath = SelectionStateModel.getImagePath();
          m.chai.expect(imagePath).to.equal('foo.img');
        });

        it('getImageSize() should return the image size', function() {
          const imageSize = SelectionStateModel.getImageSize();
          m.chai.expect(imageSize).to.equal(999999999);
        });

        it('hasDrive() should return false', function() {
          const hasDrive = SelectionStateModel.hasDrive();
          m.chai.expect(hasDrive).to.be.false;
        });

        it('hasImage() should return true', function() {
          const hasImage = SelectionStateModel.hasImage();
          m.chai.expect(hasImage).to.be.true;
        });

      });

    });

    describe('.isCurrentDrive()', function() {

      describe('given a selected drive', function() {

        beforeEach(function() {
          SelectionStateModel.setDrive({
            device: '/dev/sdb',
            description: 'DataTraveler 2.0',
            size: '7.3G',
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false
          });
        });

        it('should return false if an undefined value is passed', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive()).to.be.false;
        });

        it('should return false if an empty object is passed', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive({})).to.be.false;
        });

        it('should return true given the exact same drive', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive({
            device: '/dev/sdb',
            description: 'DataTraveler 2.0',
            size: '7.3G',
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false
          })).to.be.true;
        });

        it('should return true given the exact same drive with a $$hashKey', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive({
            device: '/dev/sdb',
            description: 'DataTraveler 2.0',
            size: '7.3G',
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false,
            $$hashKey: 1234
          })).to.be.true;
        });

        it('should return false if the device changes', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive({
            device: '/dev/sdc',
            description: 'DataTraveler 2.0',
            size: '7.3G',
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false
          })).to.be.false;
        });

        it('should return true if the description changes', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive({
            device: '/dev/sdb',
            description: 'DataTraveler 3.0',
            size: '7.3G',
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false
          })).to.be.true;
        });

      });

      describe('given no selected drive', function() {

        beforeEach(function() {
          SelectionStateModel.removeDrive();
        });

        it('should return false if an undefined value is passed', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive()).to.be.false;
        });

        it('should return false if an empty object is passed', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive({})).to.be.false;
        });

        it('should return false for anything', function() {

          m.chai.expect(SelectionStateModel.isCurrentDrive({
            device: '/dev/sdb',
            description: 'DataTraveler 2.0',
            size: '7.3G',
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false
          })).to.be.false;

        });

      });

    });

    describe('.toggleSetDrive()', function() {

      describe('given a selected drive', function() {

        beforeEach(function() {
          this.drive = {
            device: '/dev/sdb',
            description: 'DataTraveler 2.0',
            size: '7.3G',
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false
          };

          SelectionStateModel.setDrive(this.drive);
        });

        it('should be able to remove the drive', function() {
          m.chai.expect(SelectionStateModel.hasDrive()).to.be.true;
          SelectionStateModel.toggleSetDrive(this.drive);
          m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
        });

        it('should be able to replace the drive', function() {
          const drive = {
            device: '/dev/disk2',
            name: 'USB Drive',
            size: '16GB'
          };

          m.chai.expect(SelectionStateModel.getDrive()).to.deep.equal(this.drive);
          SelectionStateModel.toggleSetDrive(drive);
          m.chai.expect(SelectionStateModel.getDrive()).to.deep.equal(drive);
          m.chai.expect(SelectionStateModel.getDrive()).to.not.deep.equal(this.drive);
        });

      });

      describe('given no selected drive', function() {

        beforeEach(function() {
          SelectionStateModel.removeDrive();
        });

        it('should set the drive', function() {
          const drive = {
            device: '/dev/disk2',
            name: 'USB Drive',
            size: '16GB'
          };

          m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
          SelectionStateModel.toggleSetDrive(drive);
          m.chai.expect(SelectionStateModel.getDrive()).to.deep.equal(drive);
        });

      });

    });

  });

});
