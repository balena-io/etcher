'use strict';

const _ = require('lodash');
const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');

describe('Browser: DriveSelector', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/components/drive-selector/drive-selector')
  ));

  describe('DriveSelectorController', function() {

    const defaultDrive = {
      device: '/dev/disk2',
      name: 'My Drive',
      size: 123456789,
      protected: false,
      system: false
    };

    let currentDrive;

    let $controller;
    let $q;
    let $rootScope;

    const importSelectionStateModel = () => {
      beforeEach(angular.mock.module({
        SelectionStateModel: {
          getDrive: () => {
            return currentDrive;
          },
          hasDrive: () => {
            return Boolean(currentDrive);
          },
          isSystemDrive: () => {
            return Boolean(currentDrive.system);
          }
        }
      }));
    };

    const injectDependencies = () => {
      beforeEach(angular.mock.inject(function(_$controller_, _$q_, _$rootScope_) {
        $controller = _$controller_;
        $q = _$q_;
        $rootScope = _$rootScope_;
      }));
    };

    // Note '$rootScope' won't be instantiated until inside an 'it',
    // therefore only call this function there or in a deeper scope.
    const makeDriveSelectorController = () => {
      const scope = $rootScope.$new();

      return $controller('DriveSelectorController', {
        $scope: scope,

        // Inject stub for $uibModalInstance; this is necessary because
        // none is provided by UI Bootstrap.
        $uibModalInstance: {
          result: $q.resolve(),
          opened: $q.resolve(),
          closed: $q.resolve(),
          rendered: $q.resolve(),
          close: _.constant($q.resolve()),
          dismiss: _.constant($q.reject())
        }
      });
    };

    describe('.getButtonStatus()', function() {

      importSelectionStateModel();
      injectDependencies();

      describe('given there is no selected drive', function() {

        it('should return "disabled"', function() {

          const DriveSelectorController = makeDriveSelectorController();

          currentDrive = undefined;

          const result = DriveSelectorController.getButtonStatus();

          m.chai.expect(result).to.equal('disabled');

        });
      });

      describe('given there is a protected drive', function() {

        it('should return "disabled"', function() {

          const DriveSelectorController = makeDriveSelectorController();

          currentDrive = _.merge(defaultDrive, {
            protected: true
          });

          const result = DriveSelectorController.getButtonStatus();

          m.chai.expect(result).to.equal('disabled');

        });
      });

      describe('given there is a system drive', function() {

        it('should return "danger"', function() {

          const DriveSelectorController = makeDriveSelectorController();

          currentDrive = _.merge(defaultDrive, {
            protected: false,
            system: true
          });

          const result = DriveSelectorController.getButtonStatus();

          m.chai.expect(result).to.equal('danger');

        });
      });

      describe('given there is a removable drive', function() {

        it('should return "primary"', function() {

          const DriveSelectorController = makeDriveSelectorController();

          currentDrive = _.merge(defaultDrive, {
            protected: false,
            system: false
          });

          const result = DriveSelectorController.getButtonStatus();
          m.chai.expect(result).to.equal('primary');

        });
      });
    });

    describe('.getFooterMessage()', function() {

      importSelectionStateModel();
      injectDependencies();

      describe('given there is no drive', function() {

        it('should be undefined', function() {

          const DriveSelectorController = makeDriveSelectorController();

          currentDrive = undefined;

          const result = DriveSelectorController.getFooterMessage();

          m.chai.expect(result).to.be.undefined;

        });
      });

      describe('given there is a system drive', function() {

        it('should not be undefined', function() {

          const DriveSelectorController = makeDriveSelectorController();

          currentDrive = _.merge(defaultDrive, {
            protected: false,
            system: true
          });

          const result = DriveSelectorController.getFooterMessage();

          m.chai.expect(result).to.not.be.undefined;

        });
      });
    });

    describe('.hasFooterMessage()', function() {

      importSelectionStateModel();
      injectDependencies();

      describe('given there is no drive', function() {

        it('should be false', function() {

          const DriveSelectorController = makeDriveSelectorController();

          currentDrive = undefined;

          const result = DriveSelectorController.hasFooterMessage();

          m.chai.expect(result).to.be.false;
        });
      });

      describe('given there is a system drive', function() {

        it('should be true', function() {

          const DriveSelectorController = makeDriveSelectorController();

          currentDrive = _.merge(defaultDrive, {
            protected: false,
            system: true
          });

          const result = DriveSelectorController.hasFooterMessage();

          m.chai.expect(result).to.be.true;
        });
      });
    });
  });
});
