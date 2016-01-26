'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/modules/selection-state');

describe('Browser: SelectionState', function() {

  beforeEach(angular.mock.module('ResinEtcher.selection-state'));

  describe('SelectionStateService', function() {

    let SelectionStateService;

    beforeEach(angular.mock.inject(function(_SelectionStateService_) {
      SelectionStateService = _SelectionStateService_;
    }));

    describe('given a clean state', function() {

      beforeEach(function() {
        SelectionStateService.clear();
      });

      it('getDrive() should return undefined', function() {
        const drive = SelectionStateService.getDrive();
        m.chai.expect(drive).to.be.undefined;
      });

      it('getImage() should return undefined', function() {
        const image = SelectionStateService.getImage();
        m.chai.expect(image).to.be.undefined;
      });

      it('hasDrive() should return false', function() {
        const hasDrive = SelectionStateService.hasDrive();
        m.chai.expect(hasDrive).to.be.false;
      });

      it('hasImage() should return false', function() {
        const hasImage = SelectionStateService.hasImage();
        m.chai.expect(hasImage).to.be.false;
      });

    });

    describe('given a drive', function() {

      beforeEach(function() {
        SelectionStateService.setDrive('/dev/disk2');
      });

      describe('.getDrive()', function() {

        it('should return the drive', function() {
          const drive = SelectionStateService.getDrive();
          m.chai.expect(drive).to.equal('/dev/disk2');
        });

      });

      describe('.hasDrive()', function() {

        it('should return true', function() {
          const hasDrive = SelectionStateService.hasDrive();
          m.chai.expect(hasDrive).to.be.true;
        });

      });

      describe('.setDrive()', function() {

        it('should override the drive', function() {
          SelectionStateService.setDrive('/dev/disk5');
          const drive = SelectionStateService.getDrive();
          m.chai.expect(drive).to.equal('/dev/disk5');
        });

      });

      describe('.removeDrive()', function() {

        it('should clear the drive', function() {
          SelectionStateService.removeDrive();
          const drive = SelectionStateService.getDrive();
          m.chai.expect(drive).to.be.undefined;
        });

      });

    });

    describe('given no drive', function() {

      describe('.setDrive()', function() {

        it('should be able to set a drive', function() {
          SelectionStateService.setDrive('/dev/disk5');
          const drive = SelectionStateService.getDrive();
          m.chai.expect(drive).to.equal('/dev/disk5');
        });

      });

    });

    describe('given an image', function() {

      beforeEach(function() {
        SelectionStateService.setImage('foo.img');
      });

      describe('.getImage()', function() {

        it('should return the image', function() {
          const image = SelectionStateService.getImage();
          m.chai.expect(image).to.equal('foo.img');
        });

      });

      describe('.hasImage()', function() {

        it('should return true', function() {
          const hasImage = SelectionStateService.hasImage();
          m.chai.expect(hasImage).to.be.true;
        });

      });

      describe('.setImage()', function() {

        it('should override the image', function() {
          SelectionStateService.setImage('bar.img');
          const image = SelectionStateService.getImage();
          m.chai.expect(image).to.equal('bar.img');
        });

      });

      describe('.removeImage()', function() {

        it('should clear the image', function() {
          SelectionStateService.removeImage();
          const image = SelectionStateService.getImage();
          m.chai.expect(image).to.be.undefined;
        });

      });

    });

    describe('given no image', function() {

      describe('.setImage()', function() {

        it('should be able to set an image', function() {
          SelectionStateService.setImage('foo.img');
          const image = SelectionStateService.getImage();
          m.chai.expect(image).to.equal('foo.img');
        });

      });

    });

    describe('given a drive', function() {

      beforeEach(function() {
        SelectionStateService.setDrive('/dev/disk2');
        SelectionStateService.setImage('foo.img');
      });

      describe('.clear()', function() {

        it('should clear all selections', function() {
          m.chai.expect(SelectionStateService.hasDrive()).to.be.true;
          m.chai.expect(SelectionStateService.hasImage()).to.be.true;

          SelectionStateService.clear();

          m.chai.expect(SelectionStateService.hasDrive()).to.be.false;
          m.chai.expect(SelectionStateService.hasImage()).to.be.false;
        });

      });

      describe('given the preserveImage option', function() {

        beforeEach(function() {
          SelectionStateService.clear({
            preserveImage: true
          });
        });

        it('getDrive() should return undefined', function() {
          const drive = SelectionStateService.getDrive();
          m.chai.expect(drive).to.be.undefined;
        });

        it('getImage() should return the image', function() {
          const image = SelectionStateService.getImage();
          m.chai.expect(image).to.equal('foo.img');
        });

        it('hasDrive() should return false', function() {
          const hasDrive = SelectionStateService.hasDrive();
          m.chai.expect(hasDrive).to.be.false;
        });

        it('hasImage() should return true', function() {
          const hasImage = SelectionStateService.hasImage();
          m.chai.expect(hasImage).to.be.true;
        });

      });

    });

  });

});
