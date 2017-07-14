/*
 * Copyright 2017 resin.io
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
const DATA_PATH = path.join(__dirname, 'data');
const mime = require('../../lib/image-stream/mime');

describe('ImageStream: MIME', function() {

  describe('.getMimeTypeFromFileName()', function() {

    it('should resolve application/x-bzip2 for a bz2 archive', function() {
      const file = path.join(DATA_PATH, 'bz2', 'etcher-test.img.bz2');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-bzip2');
      });
    });

    it('should resolve application/x-xz for a xz archive', function() {
      const file = path.join(DATA_PATH, 'xz', 'etcher-test.img.xz');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-xz');
      });
    });

    it('should resolve application/gzip for a gz archive', function() {
      const file = path.join(DATA_PATH, 'gz', 'etcher-test.img.gz');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/gzip');
      });
    });

    it('should resolve application/zip for a zip archive', function() {
      const file = path.join(DATA_PATH, 'zip', 'zip-directory-etcher-only.zip');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/zip');
      });
    });

    it('should resolve application/octet-stream for an uncompressed image', function() {
      const file = path.join(DATA_PATH, 'images', 'etcher-test.img');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/octet-stream');
      });
    });

    it('should resolve application/x-iso9660-image for an uncompressed iso', function() {
      const file = path.join(DATA_PATH, 'images', 'etcher-test.iso');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-iso9660-image');
      });
    });

    it('should resolve application/x-apple-diskimage for a compressed Apple disk image', function() {
      const file = path.join(DATA_PATH, 'dmg', 'etcher-test-zlib.dmg');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-apple-diskimage');
      });
    });

    it('should resolve application/x-apple-diskimage for an uncompressed Apple disk image', function() {
      const file = path.join(DATA_PATH, 'dmg', 'etcher-test-raw.dmg');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-apple-diskimage');
      });
    });

    it('should resolve application/octet-stream for an unrecognized file type', function() {
      const file = path.join(DATA_PATH, 'unrecognized', 'random.rpi-sdcard');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/octet-stream');
      });
    });

    it('should resolve the correct MIME type given an invalid extension', function() {
      const file = path.join(DATA_PATH, 'unrecognized', 'xz-with-invalid-extension.foo');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-xz');
      });
    });

    it('should resolve the correct MIME type given no extension', function() {
      const file = path.join(DATA_PATH, 'unrecognized', 'xz-without-extension');
      return mime.getMimeTypeFromFileName(file).then((type) => {
        m.chai.expect(type).to.equal('application/x-xz');
      });
    });

  });

});
