'use strict';

const m = require('mochainon');
const Bluebird = require('bluebird');
const drivelist = require('drivelist');
const drives = require('../../lib/src/drives');

describe('Drives:', function() {

  describe('.listRemovable()', function() {

    describe('given no available drives', function() {

      beforeEach(function() {
        this.drivesListStub = m.sinon.stub(drivelist, 'listAsync');
        this.drivesListStub.returns(Bluebird.resolve([]));
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should eventually equal an empty array', function() {
        const promise = drives.listRemovable();
        m.chai.expect(promise).to.eventually.become([]);
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

        this.drivesListStub = m.sinon.stub(drivelist, 'listAsync');
        this.drivesListStub.returns(Bluebird.resolve(this.drives));
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should eventually equal an empty array', function() {
        const promise = drives.listRemovable();
        m.chai.expect(promise).to.eventually.become([]);
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

        this.drivesListStub = m.sinon.stub(drivelist, 'listAsync');
        this.drivesListStub.returns(Bluebird.resolve(this.drives));
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should eventually become the removable drives', function() {
        const promise = drives.listRemovable();
        m.chai.expect(promise).to.eventually.become([
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
      });

    });

    describe('given an error when listing the drives', function() {

      beforeEach(function() {
        this.drivesListStub = m.sinon.stub(drivelist, 'listAsync');
        this.drivesListStub.returns(Bluebird.reject(new Error('scan error')));
      });

      afterEach(function() {
        this.drivesListStub.restore();
      });

      it('should be rejected with the error', function() {
        const promise = drives.listRemovable();
        m.chai.expect(promise).to.be.rejectedWith('scan error');
      });

    });

  });

});
