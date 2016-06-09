'use strict';

const m = require('mochainon');
const angular = require('angular');
const drivelist = require('drivelist');
require('angular-mocks');

describe('Browser: DriveScanner', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/modules/drive-scanner')
  ));

  beforeEach(angular.mock.module(
    require('../../../lib/gui/models/drives')
  ));

  describe('DriveScannerService', function() {

    let $interval;
    let $rootScope;
    let $timeout;
    let $q;
    let DrivesModel;
    let DriveScannerService;

    beforeEach(angular.mock.inject(function(_$interval_, _$rootScope_, _$timeout_, _$q_, _DriveScannerService_, _DrivesModel_) {
      $interval = _$interval_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      $q = _$q_;
      DriveScannerService = _DriveScannerService_;
      DrivesModel = _DrivesModel_;
    }));

    describe('.scan()', function() {

      describe('given no available drives', function() {

        beforeEach(function() {
          this.drivesListStub = m.sinon.stub(drivelist, 'list');
          this.drivesListStub.yields(null, []);
        });

        afterEach(function() {
          this.drivesListStub.restore();
        });

        it('should eventually equal an empty array', function(done) {
          DriveScannerService.scan().then(function(drives) {
            m.chai.expect(drives).to.deep.equal([]);
            done();
          });

          $rootScope.$apply();
        });

      });

      describe('given available system drives', function() {

        beforeEach(function() {
          this.drives = [
            {
              device: '/dev/sda',
              description: 'WDC WD10JPVX-75J',
              size: '931.5G',
              mountpoint: '/',
              system: true
            }
          ];

          this.drivesListStub = m.sinon.stub(drivelist, 'list');
          this.drivesListStub.yields(null, this.drives);
        });

        afterEach(function() {
          this.drivesListStub.restore();
        });

        it('should eventually equal an empty array', function(done) {
          DriveScannerService.scan().then(function(drives) {
            m.chai.expect(drives).to.deep.equal([]);
            done();
          });

          $rootScope.$apply();
        });

      });

      describe('given available system and removable drives', function() {

        beforeEach(function() {
          this.drives = [
            {
              device: '/dev/sda',
              description: 'WDC WD10JPVX-75J',
              size: '931.5G',
              mountpoint: '/',
              system: true
            },
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

          this.drivesListStub = m.sinon.stub(drivelist, 'list');
          this.drivesListStub.yields(null, this.drives);
        });

        afterEach(function() {
          this.drivesListStub.restore();
        });

        it('should eventually become the removable drives', function(done) {
          DriveScannerService.scan().then(function(drives) {
            m.chai.expect(drives).to.deep.equal([
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
            ]);
            done();
          });

          $rootScope.$apply();
        });

      });

      describe('given an error when listing the drives', function() {

        beforeEach(function() {
          this.drivesListStub = m.sinon.stub(drivelist, 'list');
          this.drivesListStub.yields(new Error('scan error'));
        });

        afterEach(function() {
          this.drivesListStub.restore();
        });

        it('should be rejected with the error', function(done) {
          DriveScannerService.scan().catch(function(error) {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.message).to.equal('scan error');
            done();
          });

          $rootScope.$apply();
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
        m.chai.expect(DrivesModel.getDrives()).to.deep.equal(this.drives);
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
