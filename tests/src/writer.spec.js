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

});
