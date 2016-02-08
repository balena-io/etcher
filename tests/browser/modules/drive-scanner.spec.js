'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/modules/drive-scanner');

describe('Browser: DriveScanner', function() {

  beforeEach(angular.mock.module('Etcher.drive-scanner'));

  describe('DriveScannerService', function() {

    let $interval;
    let $timeout;
    let $q;
    let DriveScannerService;

    beforeEach(angular.mock.inject(function(_$interval_, _$timeout_, _$q_, _DriveScannerService_) {
      $interval = _$interval_;
      $timeout = _$timeout_;
      $q = _$q_;
      DriveScannerService = _DriveScannerService_;
    }));

    it('should have no drives by default', function() {
      m.chai.expect(DriveScannerService.drives).to.deep.equal([]);
    });

    describe('given no drives', function() {

      describe('.hasAvailableDrives()', function() {

        it('should return false', function() {
          const hasDrives = DriveScannerService.hasAvailableDrives();
          m.chai.expect(hasDrives).to.be.false;
        });

      });

      describe('.setDrives()', function() {

        it('should be able to set drives', function() {
          const drives = [
            {
              device: '/dev/sdb',
              description: 'Foo',
              size: '14G',
              mountpoint: '/mnt/foo',
              system: false
            }
          ];

          DriveScannerService.setDrives(drives);
          m.chai.expect(DriveScannerService.drives).to.deep.equal(drives);
        });

      });

    });

    describe('given drives', function() {

      beforeEach(function() {
        this.drives = [
          {
            device: '/dev/sdb',
            description: 'Foo',
            size: '14G',
            mountpoint: '/mnt/foo',
            system: false
          },
          {
            device: '/dev/sdc',
            description: 'Bar',
            size: '14G',
            mountpoint: '/mnt/bar',
            system: false
          }
        ];

        DriveScannerService.drives = this.drives;
      });

      describe('.hasAvailableDrives()', function() {

        it('should return true', function() {
          const hasDrives = DriveScannerService.hasAvailableDrives();
          m.chai.expect(hasDrives).to.be.true;
        });

      });

      describe('.setDrives()', function() {

        it('should keep the same drives if equal', function() {
          DriveScannerService.setDrives(this.drives);
          m.chai.expect(DriveScannerService.drives).to.deep.equal(this.drives);
        });

        it('should consider drives with different $$hashKey the same', function() {
          this.drives[0].$$haskey = 1234;
          DriveScannerService.setDrives(this.drives);
          m.chai.expect(DriveScannerService.drives).to.deep.equal(this.drives);
        });

      });

    });

    describe('given available drives', function() {

      beforeEach(function() {
        this.drives = [
          {
            device: '/dev/sdb',
            description: 'Foo',
            size: '14G',
            mountpoint: '/mnt/foo',
            system: false
          },
          {
            device: '/dev/sdc',
            description: 'Bar',
            size: '14G',
            mountpoint: '/mnt/bar',
            system: false
          }
        ];

        this.scanStub = m.sinon.stub(DriveScannerService, 'scan');
        this.scanStub.returns($q.resolve(this.drives));
      });

      afterEach(function() {
        this.scanStub.restore();
      });

      it('should set the drives to the scanned ones', function() {
        DriveScannerService.start(200);
        $timeout.flush();
        $interval.flush(400);
        m.chai.expect(DriveScannerService.drives).to.deep.equal(this.drives);
        DriveScannerService.stop();
      });

      describe('.start()', function() {

        it('should emit a `scan` event with the drives', function() {
          const emitter = DriveScannerService.start(2000);
          const scanSpy = m.sinon.spy();
          emitter.on('scan', scanSpy);
          $timeout.flush();
          $interval.flush(1000);
          m.chai.expect(scanSpy).to.have.been.calledOnce;
          m.chai.expect(scanSpy).to.have.been.calledWith(this.drives);
          DriveScannerService.stop();
        });

      });

    });

  });
});
