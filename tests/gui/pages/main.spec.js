'use strict';

const m = require('mochainon');
const _ = require('lodash');
const path = require('path');
const supportedFormats = require('../../../lib/shared/supported-formats');
const angular = require('angular');
const settings = require('../../../lib/gui/models/settings');
const flashState = require('../../../lib/gui/models/flash-state');
require('angular-mocks');

describe('Browser: MainPage', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/pages/main/main')
  ));

  describe('MainController', function() {

    let $controller;
    let SelectionStateModel;
    let DrivesModel;

    beforeEach(angular.mock.inject(function(_$controller_, _SelectionStateModel_, _DrivesModel_) {
      $controller = _$controller_;
      SelectionStateModel = _SelectionStateModel_;
      DrivesModel = _DrivesModel_;
    }));

    describe('.shouldDriveStepBeDisabled()', function() {

      it('should return true if there is no drive', function() {
        const controller = $controller('MainController', {
          $scope: {}
        });

        SelectionStateModel.clear();

        m.chai.expect(controller.shouldDriveStepBeDisabled()).to.be.true;
      });

      it('should return false if there is a drive', function() {
        const controller = $controller('MainController', {
          $scope: {}
        });

        SelectionStateModel.setImage({
          path: 'rpi.img',
          extension: 'img',
          size: {
            original: 99999,
            final: {
              estimation: false,
              value: 99999
            }
          }
        });

        m.chai.expect(controller.shouldDriveStepBeDisabled()).to.be.false;
      });

    });

    describe('.shouldFlashStepBeDisabled()', function() {

      it('should return true if there is no selected drive nor image', function() {
        const controller = $controller('MainController', {
          $scope: {}
        });

        SelectionStateModel.clear();

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.true;
      });

      it('should return true if there is a selected image but no drive', function() {
        const controller = $controller('MainController', {
          $scope: {}
        });

        SelectionStateModel.clear();
        SelectionStateModel.setImage({
          path: 'rpi.img',
          extension: 'img',
          size: {
            original: 99999,
            final: {
              estimation: false,
              value: 99999
            }
          }
        });

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.true;
      });

      it('should return true if there is a selected drive but no image', function() {
        const controller = $controller('MainController', {
          $scope: {}
        });

        DrivesModel.setDrives([
          {
            device: '/dev/disk2',
            description: 'Foo',
            size: 99999,
            mountpoint: '/mnt/foo',
            system: false
          }
        ]);

        SelectionStateModel.clear();
        SelectionStateModel.setDrive('/dev/disk2');

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.true;
      });

      it('should return false if there is a selected drive and a selected image', function() {
        const controller = $controller('MainController', {
          $scope: {}
        });

        DrivesModel.setDrives([
          {
            device: '/dev/disk2',
            description: 'Foo',
            size: 99999,
            mountpoint: '/mnt/foo',
            system: false
          }
        ]);

        SelectionStateModel.clear();
        SelectionStateModel.setDrive('/dev/disk2');

        SelectionStateModel.setImage({
          path: 'rpi.img',
          extension: 'img',
          size: {
            original: 99999,
            final: {
              estimation: false,
              value: 99999
            }
          }
        });

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.false;
      });

    });

  });

  describe('ImageSelectionController', function() {

    let $controller;
    let SelectionStateModel;

    beforeEach(angular.mock.inject(function(_$controller_, _SelectionStateModel_) {
      $controller = _$controller_;
      SelectionStateModel = _SelectionStateModel_;
    }));

    it('should contain all available extensions in mainSupportedExtensions and extraSupportedExtensions', function() {
      const $scope = {};
      const controller = $controller('ImageSelectionController', {
        $scope
      });

      const extensions = controller.mainSupportedExtensions.concat(controller.extraSupportedExtensions);
      m.chai.expect(_.sortBy(extensions)).to.deep.equal(_.sortBy(supportedFormats.getAllExtensions()));
    });

    describe('.getImageBasename()', function() {

      it('should return the basename of the selected image', function() {
        const controller = $controller('ImageSelectionController', {
          $scope: {}
        });

        SelectionStateModel.setImage({
          path: path.join(__dirname, 'foo', 'bar.img'),
          extension: 'img',
          size: {
            original: 999999999,
            final: {
              estimation: false,
              value: 999999999
            }
          }
        });

        m.chai.expect(controller.getImageBasename()).to.equal('bar.img');
        SelectionStateModel.removeImage();
      });

      it('should return an empty string if no selected image', function() {
        const controller = $controller('ImageSelectionController', {
          $scope: {}
        });

        SelectionStateModel.removeImage();
        m.chai.expect(controller.getImageBasename()).to.equal('');
      });

    });

  });

  describe('FlashController', function() {

    let $controller;

    beforeEach(angular.mock.inject(function(_$controller_) {
      $controller = _$controller_;
    }));

    describe('.getProgressButtonLabel()', function() {

      it('should return "Flash!" given a clean state', function() {
        const controller = $controller('FlashController', {
          $scope: {}
        });

        flashState.resetState();
        m.chai.expect(controller.getProgressButtonLabel()).to.equal('Flash!');
      });

      describe('given there is a flash in progress', function() {

        beforeEach(function() {
          flashState.setFlashingFlag();
        });

        it('should report 0% if percentage == 0 but speed != 0', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'write',
            percentage: 0,
            eta: 15,
            speed: 100000000000000
          });

          settings.set('ejectOnSuccess', true);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('0%');
        });

        it('should handle percentage == 0, type = write, ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'write',
            percentage: 0,
            eta: 15,
            speed: 0
          });

          settings.set('ejectOnSuccess', true);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('Starting...');
        });

        it('should handle percentage == 0, type = write, !ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'write',
            percentage: 0,
            eta: 15,
            speed: 0
          });

          settings.set('ejectOnSuccess', false);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('Starting...');
        });

        it('should handle percentage == 0, type = check, ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'check',
            percentage: 0,
            eta: 15,
            speed: 0
          });

          settings.set('ejectOnSuccess', true);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('Starting...');
        });

        it('should handle percentage == 0, type = check, !ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'check',
            percentage: 0,
            eta: 15,
            speed: 0
          });

          settings.set('ejectOnSuccess', false);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('Starting...');
        });

        it('should handle percentage == 50, type = write, ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15,
            speed: 1000
          });

          settings.set('ejectOnSuccess', true);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('50%');
        });

        it('should handle percentage == 50, type = write, !ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15,
            speed: 1000
          });

          settings.set('ejectOnSuccess', false);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('50%');
        });

        it('should handle percentage == 50, type = check, ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'check',
            percentage: 50,
            eta: 15,
            speed: 1000
          });

          settings.set('ejectOnSuccess', true);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('50% Validating...');
        });

        it('should handle percentage == 50, type = check, !ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'check',
            percentage: 50,
            eta: 15,
            speed: 1000
          });

          settings.set('ejectOnSuccess', false);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('50% Validating...');
        });

        it('should handle percentage == 100, type = write, ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'write',
            percentage: 100,
            eta: 15,
            speed: 1000
          });

          settings.set('ejectOnSuccess', true);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('Finishing...');
        });

        it('should handle percentage == 100, type = write, !ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'write',
            percentage: 100,
            eta: 15,
            speed: 1000
          });

          settings.set('ejectOnSuccess', false);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('Finishing...');
        });

        it('should handle percentage == 100, type = check, ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'check',
            percentage: 100,
            eta: 15,
            speed: 1000
          });

          settings.set('ejectOnSuccess', true);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('Ejecting...');
        });

        it('should handle percentage == 100, type = check, !ejectOnSuccess', function() {
          const controller = $controller('FlashController', {
            $scope: {}
          });

          flashState.setProgressState({
            type: 'check',
            percentage: 100,
            eta: 15,
            speed: 1000
          });

          settings.set('ejectOnSuccess', false);
          m.chai.expect(controller.getProgressButtonLabel()).to.equal('Finishing...');
        });

      });

    });

  });

});
