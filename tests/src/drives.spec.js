var m = require('mochainon');
var drivelist = require('drivelist');
var drives = require('../../lib/src/drives');

describe('Drives:', function() {
  'use strict';

  describe('.list()', function() {

    describe('given no available drives', function() {

      beforeEach(function() {
        this.drivelistListStub = m.sinon.stub(drivelist, 'list');
        this.drivelistListStub.yields(null, []);
      });

      afterEach(function() {
        this.drivelistListStub.restore();
      });

      it('should eventually equal an empty array', function(done) {
        drives.list().then(function(drives) {
          m.chai.expect(drives).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

    describe('given available drives', function() {

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

        this.drivelistListStub = m.sinon.stub(drivelist, 'list');
        this.drivelistListStub.yields(null, this.drives);
      });

      afterEach(function() {
        this.drivelistListStub.restore();
      });

      it('should eventually equal the drives', function(done) {
        drives.list().then(function(drives) {
          m.chai.expect(drives).to.deep.equal(this.drives);
          done();
        }.bind(this)).catch(done);
      });

    });

    describe('given an error when listing the drives', function() {

      beforeEach(function() {
        this.drivelistListStub = m.sinon.stub(drivelist, 'list');
        this.drivelistListStub.yields(new Error('scan error'));
      });

      afterEach(function() {
        this.drivelistListStub.restore();
      });

      it('should be rejected with the error', function(done) {
        drives.list().catch(function(error) {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('scan error');
          return done();
        }).catch(done);
      });

    });

  });

  describe('.listRemovable()', function() {

    describe('given no available drives', function() {

      beforeEach(function() {
        this.drivesListStub = m.sinon.stub(drives, 'list');
        this.drivesListStub.returns(Promise.resolve([]));
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should eventually equal an empty array', function(done) {
        drives.listRemovable().then(function(drives) {
          m.chai.expect(drives).to.deep.equal([]);
          done();
        }).catch(done);
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

        this.drivesListStub = m.sinon.stub(drives, 'list');
        this.drivesListStub.returns(Promise.resolve(this.drives));
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should eventually equal an empty array', function(done) {
        drives.listRemovable().then(function(drives) {
          m.chai.expect(drives).to.deep.equal([]);
          done();
        }).catch(done);
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

        this.drivesListStub = m.sinon.stub(drives, 'list');
        this.drivesListStub.returns(Promise.resolve(this.drives));
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should eventually become the removable drives', function(done) {
        drives.listRemovable().then(function(drives) {
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
        }).catch(done);
      });

    });

    describe('given an error when listing the drives', function() {

      beforeEach(function() {
        this.drivesListStub = m.sinon.stub(drives, 'list');
        this.drivesListStub.returns(Promise.reject(new Error('scan error')));
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should be rejected with the error', function(done) {
        drives.listRemovable().catch(function(error) {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('scan error');
          return done();
        }).catch(done);
      });

    });

  });

});
