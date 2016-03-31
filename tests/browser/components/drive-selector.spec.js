'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/components/drive-selector');

describe('Browser: DriveSelector', function() {

  beforeEach(angular.mock.module('Etcher.Components.DriveSelector'));

  describe('DriveSelectorStateService', function() {

    let DriveSelectorStateService;

    beforeEach(angular.mock.inject(function(_DriveSelectorStateService_) {
      DriveSelectorStateService = _DriveSelectorStateService_;
    }));

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

        DriveSelectorStateService.selectedDrive = null;
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
        DriveSelectorStateService.selectedDrive = undefined;
        m.chai.expect(DriveSelectorStateService.isSelectedDrive({})).to.be.false;
      });

    });

    describe('.getSelectedDrive()', function() {

      it('should return undefined if no selected drive', function() {
        DriveSelectorStateService.selectedDrive = null;
        const drive = DriveSelectorStateService.getSelectedDrive();
        m.chai.expect(drive).to.not.exist;
      });

      it('should return undefined if the selected drive is an empty object', function() {
        DriveSelectorStateService.selectedDrive = {};
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

  });

});
