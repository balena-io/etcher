'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/models/selection-state');

describe('Browser: SelectionState', function() {

  beforeEach(angular.mock.module('Etcher.Models.SelectionState'));

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

      it('getImage() should return undefined', function() {
        const image = SelectionStateModel.getImage();
        m.chai.expect(image).to.be.undefined;
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
        SelectionStateModel.setImage('foo.img');
      });

      describe('.getImage()', function() {

        it('should return the image', function() {
          const image = SelectionStateModel.getImage();
          m.chai.expect(image).to.equal('foo.img');
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
          SelectionStateModel.setImage('bar.img');
          const image = SelectionStateModel.getImage();
          m.chai.expect(image).to.equal('bar.img');
        });

      });

      describe('.removeImage()', function() {

        it('should clear the image', function() {
          SelectionStateModel.removeImage();
          const image = SelectionStateModel.getImage();
          m.chai.expect(image).to.be.undefined;
        });

      });

    });

    describe('given no image', function() {

      describe('.setImage()', function() {

        it('should be able to set an image', function() {
          SelectionStateModel.setImage('foo.img');
          const image = SelectionStateModel.getImage();
          m.chai.expect(image).to.equal('foo.img');
        });

      });

    });

    describe('given a drive', function() {

      beforeEach(function() {
        SelectionStateModel.setDrive('/dev/disk2');
        SelectionStateModel.setImage('foo.img');
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

        it('getImage() should return the image', function() {
          const image = SelectionStateModel.getImage();
          m.chai.expect(image).to.equal('foo.img');
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

        it('should return false if the description changes', function() {
          m.chai.expect(SelectionStateModel.isCurrentDrive({
            device: '/dev/sdb',
            description: 'DataTraveler 3.0',
            size: '7.3G',
            mountpoint: '/media/UNTITLED',
            name: '/dev/sdb',
            system: false
          })).to.be.false;
        });

      });

      describe('given no selected drive', function() {

        beforeEach(function() {
          SelectionStateModel.removeDrive();
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

  });

});
