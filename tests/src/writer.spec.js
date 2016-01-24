'use strict';

const m = require('mochainon');
const ReadableStream = require('stream').Readable;
const path = require('path');
const writer = require('../../lib/src/writer');

describe('Writer:', function() {

  describe('.getImageStream()', function() {

    describe('given a valid image', function() {

      beforeEach(function() {
        this.image = path.join(__dirname, '..', 'utils', 'data.random');
      });

      it('should return a readable stream', function() {
        const stream = writer.getImageStream(this.image);
        m.chai.expect(stream).to.be.an.instanceof(ReadableStream);
      });

      it('should append a .length property with the correct size', function() {
        const stream = writer.getImageStream(this.image);
        m.chai.expect(stream.length).to.equal(2097152);
      });

    });

  });

});
