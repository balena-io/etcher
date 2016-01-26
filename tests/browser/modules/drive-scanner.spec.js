var m = require('mochainon');
var angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/modules/drive-scanner');

describe('Browser: DriveScanner', function() {
  'use strict';

  beforeEach(angular.mock.module('ResinEtcher.drive-scanner'));

<<<<<<< HEAD
  describe('DriveScannerRefreshService', function() {

    var DriveScannerRefreshService;
    var $interval;

    beforeEach(angular.mock.inject(function(_$interval_, _DriveScannerRefreshService_) {
      $interval = _$interval_;
      DriveScannerRefreshService = _DriveScannerRefreshService_;
    }));

    describe('.every()', function() {

      it('should call the function right away', function() {
        var spy = m.sinon.spy();
        DriveScannerRefreshService.every(spy, 1000);
        DriveScannerRefreshService.stop();
        m.chai.expect(spy).to.have.been.calledOnce;
      });

      it('should call the function in an interval', function() {
        var spy = m.sinon.spy();
        DriveScannerRefreshService.every(spy, 100);

        // 400ms = 100ms / 4 + 1 (the initial call)
        $interval.flush(400);

        DriveScannerRefreshService.stop();
        m.chai.expect(spy).to.have.callCount(5);
      });

    });

  });

=======
>>>>>>> resin-io/master
  describe('DriveScannerService', function() {

    var $interval;
    var $q;
    var DriveScannerService;

    beforeEach(angular.mock.inject(function(_$interval_, _$q_, _DriveScannerService_) {
      $interval = _$interval_;
      $q = _$q_;
      DriveScannerService = _DriveScannerService_;
    }));

    it('should have no drives by default', function() {
      m.chai.expect(DriveScannerService.drives).to.deep.equal([]);
    });

    describe('given no drives', function() {

      describe('.hasAvailableDrives()', function() {

        it('should return false', function() {
          var hasDrives = DriveScannerService.hasAvailableDrives();
          m.chai.expect(hasDrives).to.be.false;
        });

      });

      describe('.setDrives()', function() {

        it('should be able to set drives', function() {
          var drives = [
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
          var hasDrives = DriveScannerService.hasAvailableDrives();
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
        $interval.flush(400);
        m.chai.expect(DriveScannerService.drives).to.deep.equal(this.drives);
        DriveScannerService.stop();
      });

    });

  });
});
