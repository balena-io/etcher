'use strict';

const m = require('mochainon');
const path = require('path');
const angular = require('angular');
require('angular-mocks');

describe('Browser: DrivesModel', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/models/drives'),
    require('../../../lib/gui/models/selection-state')
  ));

  describe('DrivesModel', function() {

    let DrivesModel;
    let SelectionStateModel;

    beforeEach(angular.mock.inject(function(_DrivesModel_, _SelectionStateModel_) {
      DrivesModel = _DrivesModel_;
      SelectionStateModel = _SelectionStateModel_;
    }));

    it('should have no drives by default', function() {
      m.chai.expect(DrivesModel.getDrives()).to.deep.equal([]);
    });

    describe('.setDrives()', function() {

      it('should throw if no drives', function() {
        m.chai.expect(function() {
          DrivesModel.setDrives();
        }).to.throw('Missing drives');
      });

      it('should throw if drives is not an array', function() {
        m.chai.expect(function() {
          DrivesModel.setDrives(123);
        }).to.throw('Invalid drives: 123');
      });

      it('should throw if drives is not an array of objects', function() {
        m.chai.expect(function() {
          DrivesModel.setDrives([
            123,
            123,
            123
          ]);
        }).to.throw('Invalid drives: 123,123,123');
      });

    });

    describe('given no drives', function() {

      describe('.hasAvailableDrives()', function() {

        it('should return false', function() {
          m.chai.expect(DrivesModel.hasAvailableDrives()).to.be.false;
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

          DrivesModel.setDrives(drives);
          m.chai.expect(DrivesModel.getDrives()).to.deep.equal(drives);
        });

        describe('given no selected image and no selected drive', function() {

          beforeEach(function() {
            SelectionStateModel.removeDrive();
            SelectionStateModel.removeImage();
          });

          it('should auto-select a single valid available drive', function() {
            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;

            DrivesModel.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 999999999,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              }
            ]);

            m.chai.expect(SelectionStateModel.hasDrive()).to.be.true;
            m.chai.expect(SelectionStateModel.getDrive().device).to.equal('/dev/sdb');
          });

        });

        describe('given a selected image and no selected drive', function() {

          beforeEach(function() {
            if (process.platform === 'win32') {
              this.imagePath = 'E:\\bar\\foo.img';
            } else {
              this.imagePath = '/mnt/bar/foo.img';
            }

            SelectionStateModel.removeDrive();
            SelectionStateModel.setImage({
              path: this.imagePath,
              size: {
                original: 999999999,
                final: {
                  estimation: false,
                  value: 999999999
                }
              },
              recommendedDriveSize: 2000000000
            });
          });

          afterEach(function() {
            SelectionStateModel.removeImage();
          });

          it('should not auto-select when there are multiple valid available drives', function() {
            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;

            DrivesModel.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 999999999,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              },
              {
                device: '/dev/sdc',
                name: 'Bar',
                size: 999999999,
                mountpoint: '/mnt/bar',
                system: false,
                protected: false
              }
            ]);

            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
          });

          it('should auto-select a single valid available drive', function() {
            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;

            DrivesModel.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 2000000000,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              }
            ]);

            m.chai.expect(SelectionStateModel.getDrive()).to.deep.equal({
              device: '/dev/sdb',
              name: 'Foo',
              size: 2000000000,
              mountpoint: '/mnt/foo',
              system: false,
              protected: false
            });
          });

          it('should not auto-select a single too small drive', function() {
            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;

            DrivesModel.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 99999999,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              }
            ]);

            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
          });

          it('should not auto-select a single drive that doesn\'t meet the recommended size', function() {
            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;

            DrivesModel.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 1500000000,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              }
            ]);

            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
          });

          it('should not auto-select a single protected drive', function() {
            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;

            DrivesModel.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 2000000000,
                mountpoint: '/mnt/foo',
                system: false,
                protected: true
              }
            ]);

            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
          });

          it('should not auto-select a source drive', function() {
            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;

            DrivesModel.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 2000000000,
                mountpoints: [
                  {
                    path: path.dirname(this.imagePath)
                  }
                ],
                system: false,
                protected: false
              }
            ]);

            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
          });

          it('should not auto-select a single system drive', function() {
            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;

            DrivesModel.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 2000000000,
                mountpoint: '/mnt/foo',
                system: true,
                protected: false
              }
            ]);

            m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
          });

        });

      });

    });

    describe('given drives', function() {

      beforeEach(function() {
        this.drives = [
          {
            device: '/dev/sdb',
            name: 'SD Card',
            size: 9999999,
            mountpoint: '/mnt/foo',
            system: false,
            protected: false
          },
          {
            device: '/dev/sdc',
            name: 'USB Drive',
            size: 9999999,
            mountpoint: '/mnt/bar',
            system: false,
            protected: false
          }
        ];

        DrivesModel.setDrives(this.drives);
      });

      describe('given one of the drives was selected', function() {

        beforeEach(function() {
          DrivesModel.setDrives([
            {
              device: '/dev/sdc',
              name: 'USB Drive',
              size: 9999999,
              mountpoint: '/mnt/bar',
              system: false,
              protected: false
            }
          ]);

          SelectionStateModel.setDrive('/dev/sdc');
        });

        afterEach(function() {
          SelectionStateModel.removeDrive();
        });

        it('should be deleted if its not contained in the available drives anymore', function() {
          m.chai.expect(SelectionStateModel.hasDrive()).to.be.true;

          // We have to provide at least two drives, otherwise,
          // if we only provide one, the single drive will be
          // auto-selected.
          DrivesModel.setDrives([
            {
              device: '/dev/sda',
              name: 'USB Drive',
              size: 9999999,
              mountpoint: '/mnt/bar',
              system: false,
              protected: false
            },
            {
              device: '/dev/sdb',
              name: 'SD Card',
              size: 9999999,
              mountpoint: '/mnt/foo',
              system: false,
              protected: false
            }
          ]);

          m.chai.expect(SelectionStateModel.hasDrive()).to.be.false;
        });

      });

      describe('.hasAvailableDrives()', function() {

        it('should return true', function() {
          const hasDrives = DrivesModel.hasAvailableDrives();
          m.chai.expect(hasDrives).to.be.true;
        });

      });

      describe('.setDrives()', function() {

        it('should keep the same drives if equal', function() {
          DrivesModel.setDrives(this.drives);
          m.chai.expect(DrivesModel.getDrives()).to.deep.equal(this.drives);
        });

        it('should consider drives with different $$hashKey the same', function() {
          this.drives[0].$$haskey = 1234;
          DrivesModel.setDrives(this.drives);
          m.chai.expect(DrivesModel.getDrives()).to.deep.equal(this.drives);
        });

      });

    });

  });
});
