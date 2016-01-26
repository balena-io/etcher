var m = require('mochainon');
var angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/modules/selection-state');

describe('Browser: SelectionState', function() {
  'use strict';

  beforeEach(angular.mock.module('ResinEtcher.selection-state'));

  describe('SelectionStateService', function() {

    var SelectionStateService;

    beforeEach(angular.mock.inject(function(_SelectionStateService_) {
      SelectionStateService = _SelectionStateService_;
    }));

    describe('given a clean state', function() {

      beforeEach(function() {
        SelectionStateService.clear();
      });

      it('getDrive() should return undefined', function() {
        var drive = SelectionStateService.getDrive();
        m.chai.expect(drive).to.be.undefined;
      });

      it('getImage() should return undefined', function() {
        var image = SelectionStateService.getImage();
        m.chai.expect(image).to.be.undefined;
      });

      it('hasDrive() should return false', function() {
        var hasDrive = SelectionStateService.hasDrive();
        m.chai.expect(hasDrive).to.be.false;
      });

      it('hasImage() should return false', function() {
        var hasImage = SelectionStateService.hasImage();
        m.chai.expect(hasImage).to.be.false;
      });

    });

    describe('given a drive', function() {

      beforeEach(function() {
        SelectionStateService.setDrive('/dev/disk2');
      });

      describe('.getDrive()', function() {

        it('should return the drive', function() {
          var drive = SelectionStateService.getDrive();
          m.chai.expect(drive).to.equal('/dev/disk2');
        });

      });

      describe('.hasDrive()', function() {

        it('should return true', function() {
          var hasDrive = SelectionStateService.hasDrive();
          m.chai.expect(hasDrive).to.be.true;
        });

      });

      describe('.setDrive()', function() {

        it('should override the drive', function() {
          SelectionStateService.setDrive('/dev/disk5');
          var drive = SelectionStateService.getDrive();
          m.chai.expect(drive).to.equal('/dev/disk5');
        });

      });

    });

    describe('given no drive', function() {

      describe('.setDrive()', function() {

        it('should be able to set a drive', function() {
          SelectionStateService.setDrive('/dev/disk5');
          var drive = SelectionStateService.getDrive();
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
          var image = SelectionStateService.getImage();
          m.chai.expect(image).to.equal('foo.img');
        });

      });

      describe('.hasImage()', function() {

        it('should return true', function() {
          var hasImage = SelectionStateService.hasImage();
          m.chai.expect(hasImage).to.be.true;
        });

      });

      describe('.setImage()', function() {

        it('should override the image', function() {
          SelectionStateService.setImage('bar.img');
          var image = SelectionStateService.getImage();
          m.chai.expect(image).to.equal('bar.img');
        });

      });

    });

    describe('given no image', function() {

      describe('.setImage()', function() {

        it('should be able to set an image', function() {
          SelectionStateService.setImage('foo.img');
          var image = SelectionStateService.getImage();
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

    });

  });

});
