var m = require('mochainon');
var angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/modules/drive-scanner');

describe('Browser: DriveScanner', function() {
  'use strict';

  beforeEach(angular.mock.module('ResinEtcher.drive-scanner'));

  describe('DriveScannerRefreshService', function() {

    var DriveScannerRefreshService;
    var $interval;
    var $timeout;

    beforeEach(angular.mock.inject(function(_$interval_, _$timeout_, _DriveScannerRefreshService_) {
      $interval = _$interval_;
      $timeout = _$timeout_;
      DriveScannerRefreshService = _DriveScannerRefreshService_;
    }));

    describe('.every()', function() {

      it('should call the function right away', function() {
        var spy = m.sinon.spy();
        DriveScannerRefreshService.every(spy, 1000);
        $timeout.flush();
        DriveScannerRefreshService.stop();
        m.chai.expect(spy).to.have.been.calledOnce;
      });

      it('should call the function in an interval', function() {
        var spy = m.sinon.spy();
        DriveScannerRefreshService.every(spy, 100);
        $timeout.flush();

        // 400ms = 100ms / 4 + 1 (the initial call)
        $interval.flush(400);

        DriveScannerRefreshService.stop();
        m.chai.expect(spy).to.have.callCount(5);
      });

    });

  });

  describe('DriveScannerService', function() {

    var $interval;
    var $timeout;
    var $q;
    var DriveScannerService;

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
        $timeout.flush();
        $interval.flush(400);
        m.chai.expect(DriveScannerService.drives).to.deep.equal(this.drives);
        DriveScannerService.stop();
      });

      describe('.start()', function() {

        it('should emit a `scan` event with the drives', function() {
          var emitter = DriveScannerService.start(2000);
          var scanSpy = m.sinon.spy();
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
