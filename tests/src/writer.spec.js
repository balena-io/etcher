var m = require('mochainon');
var ReadableStream = require('stream').Readable;
var path = require('path');
var umount = require('umount');
var writer = require('../../lib/src/writer');

describe('Writer:', function() {
  'use strict';

  describe('.getImageStream()', function() {

    describe('given a valid image', function() {

      beforeEach(function() {
        this.image = path.join(__dirname, '..', 'utils', 'data.random');
      });

      it('should return a readable stream', function() {
        var stream = writer.getImageStream(this.image);
        m.chai.expect(stream).to.be.an.instanceof(ReadableStream);
      });

      it('should append a .length property with the correct size', function() {
        var stream = writer.getImageStream(this.image);
        m.chai.expect(stream.length).to.equal(2097152);
      });

    });

  });

  describe('.unmountDisk()', function() {

    describe('given a successful unmount', function() {

      beforeEach(function() {
        this.umountStub = m.sinon.stub(umount, 'umount');
        this.umountStub.yields(null);
      });

      afterEach(function() {
        this.umountStub.restore();
      });

      it('should eventually resolve undefined', function(done) {
        writer.unmountDisk('/dev/disk2').then(function() {
          m.chai.expect(arguments[0]).to.be.undefined;
          done();
        }).catch(done);
      });

    });

    describe('given an unsuccessful unmount', function() {

      beforeEach(function() {
        this.umountStub = m.sinon.stub(umount, 'umount');
        this.umountStub.yields(new Error('unmount error'));
      });

      afterEach(function() {
        this.umountStub.restore();
      });

      it('should be rejected with the error', function(done) {
        writer.unmountDisk('/dev/disk2').catch(function(error) {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('unmount error');
          done();
        }).catch(done);
      });

    });

  });

});
