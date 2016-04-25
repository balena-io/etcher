'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');

describe('Browser: DriveSelector', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/components/drive-selector/drive-selector')
  ));

  describe('DriveSelectorStateService', function() {

    let DriveSelectorStateService;
    let SelectionStateModel;

    beforeEach(angular.mock.inject(function(_DriveSelectorStateService_, _SelectionStateModel_) {
      DriveSelectorStateService = _DriveSelectorStateService_;
      SelectionStateModel = _SelectionStateModel_;
    }));

    beforeEach(function() {
      SelectionStateModel.clear();
    });

    describe('.toggleSelectDrive()', function() {

      it('should be able to toggle a drive', function() {
        const drive = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: '16GB'
        };

        m.chai.expect(DriveSelectorStateService.getSelectedDrive()).to.not.exist;
        DriveSelectorStateService.toggleSelectDrive(drive);
        m.chai.expect(DriveSelectorStateService.getSelectedDrive()).to.deep.equal(drive);
        DriveSelectorStateService.toggleSelectDrive(drive);
        m.chai.expect(DriveSelectorStateService.getSelectedDrive()).to.not.exist;
      });

      it('should be able to change the current selected drive', function() {
        const drive1 = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: '16GB'
        };

        const drive2 = {
          device: '/dev/disk3',
          name: 'SDCARD Reader',
          size: '4GB'
        };

        DriveSelectorStateService.toggleSelectDrive(drive1);
        m.chai.expect(DriveSelectorStateService.getSelectedDrive()).to.deep.equal(drive1);
        DriveSelectorStateService.toggleSelectDrive(drive2);
        m.chai.expect(DriveSelectorStateService.getSelectedDrive()).to.deep.equal(drive2);
      });

    });

    describe('.isSelectedDrive()', function() {

      it('should always return false if no drive', function() {
        const drive = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: '16GB'
        };

        SelectionStateModel.removeDrive();
        m.chai.expect(DriveSelectorStateService.isSelectedDrive(drive)).to.be.false;
      });

      it('should return true if the selected drive matches', function() {
        const drive = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: '16GB'
        };

        DriveSelectorStateService.toggleSelectDrive(drive);
        m.chai.expect(DriveSelectorStateService.isSelectedDrive(drive)).to.be.true;
      });

      it('should return false if the selected drive does not match', function() {
        const drive1 = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: '16GB'
        };

        const drive2 = {
          device: '/dev/disk3',
          name: 'SDCARD Reader',
          size: '4GB'
        };

        DriveSelectorStateService.toggleSelectDrive(drive1);
        m.chai.expect(DriveSelectorStateService.isSelectedDrive(drive2)).to.be.false;
      });

      it('should return false if there is no selected drive and an empty object is passed', function() {
        SelectionStateModel.removeDrive();
        m.chai.expect(DriveSelectorStateService.isSelectedDrive({})).to.be.false;
      });

      it('should return true if the drive is selected in SelectionStateModel', function() {
        const drive = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: '16GB'
        };

        SelectionStateModel.setDrive(drive);
        m.chai.expect(DriveSelectorStateService.isSelectedDrive(drive)).to.be.true;
      });

    });

    describe('.getSelectedDrive()', function() {

      it('should return undefined if no selected drive', function() {
        SelectionStateModel.removeDrive();
        const drive = DriveSelectorStateService.getSelectedDrive();
        m.chai.expect(drive).to.not.exist;
      });

      it('should return undefined if the selected drive is an empty object', function() {
        SelectionStateModel.setDrive({});
        const drive = DriveSelectorStateService.getSelectedDrive();
        m.chai.expect(drive).to.not.exist;
      });

      it('should return the selected drive if there is one', function() {
        const selectedDrive = {
          device: '/dev/disk2',
          name: 'USB Drive',
          size: '16GB'
        };

        DriveSelectorStateService.toggleSelectDrive(selectedDrive);
        const drive = DriveSelectorStateService.getSelectedDrive();
        m.chai.expect(drive).to.deep.equal(selectedDrive);
      });

    });

    describe('.hasSelectedDrive()', function() {

      it('should return false if no selected drive', function() {
        SelectionStateModel.removeDrive();
        const hasDrive = DriveSelectorStateService.hasSelectedDrive();
        m.chai.expect(hasDrive).to.be.false;
      });

      it('should return false if the selected drive is an empty object', function() {
        SelectionStateModel.setDrive({});
        const hasDrive = DriveSelectorStateService.hasSelectedDrive();
        m.chai.expect(hasDrive).to.be.false;
      });

      it('should return true if there is a selected drive', function() {
        DriveSelectorStateService.toggleSelectDrive({
          device: '/dev/disk2',
          name: 'USB Drive',
          size: '16GB'
        });

        const hasDrive = DriveSelectorStateService.hasSelectedDrive();
        m.chai.expect(hasDrive).to.be.true;
      });

    });

  });

});
