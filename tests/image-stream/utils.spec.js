/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const m = require('mochainon');
const path = require('path');
const StreamReadable = require('stream').Readable;
const DATA_PATH = path.join(__dirname, 'data');
const utils = require('../../lib/image-stream/utils');

describe('ImageStream: Utils', function() {

  describe('.getArchiveMimeType()', function() {

    it('should resolve application/x-bzip2 for a bz2 archive', function() {
      const file = path.join(DATA_PATH, 'bz2', 'raspberrypi.img.bz2');
      return utils.getArchiveMimeType(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-bzip2');
      });
    });

    it('should resolve application/x-xz for a xz archive', function() {
      const file = path.join(DATA_PATH, 'xz', 'raspberrypi.img.xz');
      return utils.getArchiveMimeType(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-xz');
      });
    });

    it('should resolve application/gzip for a gz archive', function() {
      const file = path.join(DATA_PATH, 'gz', 'raspberrypi.img.gz');
      return utils.getArchiveMimeType(file).then((type) => {
        m.chai.expect(type).to.equal('application/gzip');
      });
    });

    it('should resolve application/zip for a zip archive', function() {
      const file = path.join(DATA_PATH, 'zip', 'zip-directory-rpi-only.zip');
      return utils.getArchiveMimeType(file).then((type) => {
        m.chai.expect(type).to.equal('application/zip');
      });
    });

    it('should resolve application/octet-stream for an uncompressed image', function() {
      const file = path.join(DATA_PATH, 'images', 'raspberrypi.img');
      return utils.getArchiveMimeType(file).then((type) => {
        m.chai.expect(type).to.equal('application/octet-stream');
      });
    });

    it('should resolve application/x-apple-diskimage for a compressed Apple disk image', function() {
      const file = path.join(DATA_PATH, 'dmg', 'zlib-compressed.dmg');
      return utils.getArchiveMimeType(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-apple-diskimage');
      });
    });

    it('should resolve application/x-apple-diskimage for an uncompressed Apple disk image', function() {
      const file = path.join(DATA_PATH, 'dmg', 'raw.dmg');
      return utils.getArchiveMimeType(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-apple-diskimage');
      });
    });

  });

  describe('.extractStream()', function() {

    describe('given a stream that emits data', function() {

      beforeEach(function() {
        this.stream = new StreamReadable();

        /* eslint-disable no-underscore-dangle */

        this.stream._read = function() {

        /* eslint-enable no-underscore-dangle */

          this.push(Buffer.from('Hello', 'utf8'));
          this.push(Buffer.from(' ', 'utf8'));
          this.push(Buffer.from('World', 'utf8'));
          this.push(null);
        };
      });

      it('should yield the stream data', function(done) {
        utils.extractStream(this.stream).then((data) => {
          m.chai.expect(data.toString()).to.equal('Hello World');
          done();
        }).catch(done);
      });

    });

    describe('given a stream that throws an error', function() {

      beforeEach(function() {
        this.stream = new StreamReadable();

        /* eslint-disable no-underscore-dangle */

        this.stream._read = function() {

        /* eslint-enable no-underscore-dangle */

          this.emit('error', new Error('stream error'));
        };
      });

      it('should be rejected with the error', function(done) {
        utils.extractStream(this.stream).catch((error) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('stream error');
          done();
        });
      });

    });

  });

});
