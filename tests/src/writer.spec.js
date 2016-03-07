'use strict';

const m = require('mochainon');
const ReadableStream = require('stream').Readable;
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const path = require('path');
const tmp = require('tmp');
const rindle = require('rindle');
const writer = require('../../lib/src/writer');

describe('Writer:', function() {

  describe('.getImageStream()', function() {

    describe('given a valid image file', function() {

      beforeEach(function() {
        this.image = path.join(__dirname, '..', 'utils', 'data.random');
      });

      it('should return a readable stream', function(done) {
        writer.getImageStream(this.image).then(function(stream) {
          m.chai.expect(stream).to.be.an.instanceof(ReadableStream);
        }).nodeify(done);
      });

      it('should append a .length property with the correct size', function(done) {
        writer.getImageStream(this.image).then(function(stream) {
          m.chai.expect(stream.length).to.equal(2097152);
        }).nodeify(done);
      });

    });

    describe('given a valid image zip', function() {

      beforeEach(function() {
        this.image = path.join(__dirname, '..', 'utils', 'data.zip');
      });

      it('should return a readable stream', function(done) {
        writer.getImageStream(this.image).then(function(stream) {
          m.chai.expect(stream).to.be.an.instanceof(ReadableStream);
        }).nodeify(done);
      });

      it('should append a .length property with the correct size', function(done) {
        writer.getImageStream(this.image).then(function(stream) {
          m.chai.expect(stream.length).to.equal(2097152);
        }).nodeify(done);
      });

      it('should pipe the image from the zip', function(done) {
        const tmpFile = tmp.tmpNameSync();
        const image = path.join(__dirname, '..', 'utils', 'data.random');
        const output = fs.createWriteStream(tmpFile);

        writer.getImageStream(this.image).then(function(stream) {
          return stream.pipe(output);
        }).then(rindle.wait).then(function() {
          return Bluebird.props({
            output: fs.readFileAsync(tmpFile),
            data: fs.readFileAsync(image)
          });
        }).then(function(results) {
          m.chai.expect(results.output).to.deep.equal(results.data);
          return fs.unlinkAsync(tmpFile);
        }).nodeify(done);
      });

    });

    describe('given an invalid image zip', function() {

      beforeEach(function() {
        this.image = path.join(__dirname, '..', 'utils', 'invalid.zip');
      });

      it('should be rejected with an error', function() {
        const promise = writer.getImageStream(this.image);
        m.chai.expect(promise).to.be.rejectedWith('Invalid zip image');
      });

    });

  });

});
