'use strict';

const m = require('mochainon');
const os = require('os');
const angular = require('angular');
const drivelist = require('drivelist');
require('angular-mocks');

describe('Browser: DriveScanner', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/modules/drive-scanner')
  ));

  describe('DriveScannerService', function() {

    let DriveScannerService;

    beforeEach(angular.mock.inject(function(_DriveScannerService_) {
      DriveScannerService = _DriveScannerService_;
    }));

    describe('given no available drives', function() {

      beforeEach(function() {
        this.drivesListStub = m.sinon.stub(drivelist, 'list');
        this.drivesListStub.yields(null, []);
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should emit an empty array', function(done) {
        DriveScannerService.on('drives', function(drives) {
          m.chai.expect(drives).to.deep.equal([]);
          DriveScannerService.stop();
          done();
        });

        DriveScannerService.start();
      });

    });

    describe('given only system available drives', function() {

      beforeEach(function() {
        this.drivesListStub = m.sinon.stub(drivelist, 'list');
        this.drivesListStub.yields(null, [
          {
            device: '/dev/sda',
            description: 'WDC WD10JPVX-75J',
            size: '931.5G',
            mountpoints: [
              {
                path: '/'
              }
            ],
            system: true
          }
        ]);
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should emit an empty array', function(done) {
        DriveScannerService.on('drives', function(drives) {
          m.chai.expect(drives).to.deep.equal([]);
          DriveScannerService.stop();
          done();
        });

        DriveScannerService.start();
      });

    });

    describe('given linux', function() {

      beforeEach(function() {
        this.osPlatformStub = m.sinon.stub(os, 'platform');
        this.osPlatformStub.returns('linux');
      });

      afterEach(function() {
        this.osPlatformStub.restore();
      });

      describe('given available drives', function() {

        beforeEach(function() {
          this.drivesListStub = m.sinon.stub(drivelist, 'list');
          this.drivesListStub.yields(null, [
            {
              device: '/dev/sda',
              description: 'WDC WD10JPVX-75J',
              size: '931.5G',
              mountpoints: [
                {
                  path: '/'
                }
              ],
              system: true
            },
            {
              device: '/dev/sdb',
              description: 'Foo',
              size: '14G',
              mountpoints: [
                {
                  path: '/mnt/foo'
                }
              ],
              system: false
            },
            {
              device: '/dev/sdc',
              description: 'Bar',
              size: '14G',
              mountpoints: [
                {
                  path: '/mnt/bar'
                }
              ],
              system: false
            }
          ]);
        });

        afterEach(function() {
          this.drivesListStub.restore();
        });

        it('should emit the non removable drives', function(done) {
          DriveScannerService.on('drives', function(drives) {
            m.chai.expect(drives).to.deep.equal([
              {
                device: '/dev/sdb',
                name: '/dev/sdb',
                description: 'Foo',
                size: '14G',
                mountpoints: [
                  {
                    path: '/mnt/foo'
                  }
                ],
                system: false
              },
              {
                device: '/dev/sdc',
                name: '/dev/sdc',
                description: 'Bar',
                size: '14G',
                mountpoints: [
                  {
                    path: '/mnt/bar'
                  }
                ],
                system: false
              }
            ]);

            DriveScannerService.stop();
            done();
          });

          DriveScannerService.start();
        });

      });

    });

    describe('given windows', function() {

      beforeEach(function() {
        this.osPlatformStub = m.sinon.stub(os, 'platform');
        this.osPlatformStub.returns('win32');
      });

      afterEach(function() {
        this.osPlatformStub.restore();
      });

      describe('given available drives', function() {

        beforeEach(function() {
          this.drivesListStub = m.sinon.stub(drivelist, 'list');
          this.drivesListStub.yields(null, [
            {
              device: '\\\\.\\PHYSICALDRIVE1',
              description: 'WDC WD10JPVX-75J',
              size: '931.5G',
              mountpoints: [
                {
                  path: 'C:'
                }
              ],
              system: true
            },
            {
              device: '\\\\.\\PHYSICALDRIVE2',
              description: 'Foo',
              size: '14G',
              mountpoints: [],
              system: false
            },
            {
              device: '\\\\.\\PHYSICALDRIVE3',
              description: 'Bar',
              size: '14G',
              mountpoints: [
                {
                  path: 'F:'
                }
              ],
              system: false
            }
          ]);
        });

        afterEach(function() {
          this.drivesListStub.restore();
        });

        it('should emit the non removable drives', function(done) {
          DriveScannerService.on('drives', function(drives) {
            m.chai.expect(drives).to.deep.equal([
              {
                device: '\\\\.\\PHYSICALDRIVE2',
                name: '\\\\.\\PHYSICALDRIVE2',
                description: 'Foo',
                size: '14G',
                mountpoints: [],
                system: false
              },
              {
                device: '\\\\.\\PHYSICALDRIVE3',
                name: 'F:',
                description: 'Bar',
                size: '14G',
                mountpoints: [
                  {
                    path: 'F:'
                  }
                ],
                system: false
              }
            ]);

            DriveScannerService.stop();
            done();
          });

          DriveScannerService.start();
        });

      });

      describe('given a drive with a single drive letters', function() {

        beforeEach(function() {
          this.drivesListStub = m.sinon.stub(drivelist, 'list');
          this.drivesListStub.yields(null, [
            {
              device: '\\\\.\\PHYSICALDRIVE3',
              description: 'Bar',
              size: '14G',
              mountpoints: [
                {
                  path: 'F:'
                }
              ],
              system: false
            }
          ]);
        });

        afterEach(function() {
          this.drivesListStub.restore();
        });

        it('should use the drive letter as the name', function(done) {
          DriveScannerService.on('drives', function(drives) {
            m.chai.expect(drives).to.have.length(1);
            m.chai.expect(drives[0].name).to.equal('F:');
            DriveScannerService.stop();
            done();
          });

          DriveScannerService.start();
        });

      });

      describe('given a drive with multiple drive letters', function() {

        beforeEach(function() {
          this.drivesListStub = m.sinon.stub(drivelist, 'list');
          this.drivesListStub.yields(null, [
            {
              device: '\\\\.\\PHYSICALDRIVE3',
              description: 'Bar',
              size: '14G',
              mountpoints: [
                {
                  path: 'F:'
                },
                {
                  path: 'G:'
                },
                {
                  path: 'H:'
                }
              ],
              system: false
            }
          ]);
        });

        afterEach(function() {
          this.drivesListStub.restore();
        });

        it('should join all the mountpoints in `name`', function(done) {
          DriveScannerService.on('drives', function(drives) {
            m.chai.expect(drives).to.have.length(1);
            m.chai.expect(drives[0].name).to.equal('F:, G:, H:');
            DriveScannerService.stop();
            done();
          });

          DriveScannerService.start();
        });

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

      it('should emit the error', function(done) {
        DriveScannerService.on('error', function(error) {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('scan error');
          DriveScannerService.stop();
          done();
        });

        DriveScannerService.start();
      });

    });

  });
});
