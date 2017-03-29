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
const zipHooks = require('../../../lib/image-stream/archive-hooks/zip');
const utils = require('../../../lib/image-stream/utils');
const ZIP_PATH = path.join(__dirname, '..', 'data', 'zip');

describe('ImageStream: Archive hooks: ZIP', function() {

  this.timeout(20000);

  describe('.getEntries()', function() {

    describe('given an empty zip', function() {

      beforeEach(function() {
        this.zip = path.join(ZIP_PATH, 'zip-directory-empty.zip');
      });

      it('should become an empty array', function(done) {
        zipHooks.getEntries(this.zip).then((entries) => {
          m.chai.expect(entries).to.deep.equal([]);
        }).asCallback(done);
      });

    });

    describe('given a zip with multiple files in it', function() {

      beforeEach(function() {
        this.zip = path.join(ZIP_PATH, 'zip-directory-multiple-images.zip');
      });

      it('should become all entries', function(done) {
        zipHooks.getEntries(this.zip).then((entries) => {
          m.chai.expect(entries).to.deep.equal([
            {
              name: 'multiple-images/edison-config.img',
              size: 16777216
            },
            {
              name: 'multiple-images/raspberrypi.img',
              size: 33554432
            }
          ]);
        }).asCallback(done);
      });

    });

    describe('given a zip with nested files in it', function() {

      beforeEach(function() {
        this.zip = path.join(ZIP_PATH, 'zip-directory-nested-misc.zip');
      });

      it('should become all entries', function(done) {
        zipHooks.getEntries(this.zip).then((entries) => {
          m.chai.expect(entries).to.deep.equal([
            {
              name: 'zip-directory-nested-misc/foo',
              size: 4
            },
            {
              name: 'zip-directory-nested-misc/hello/there/bar',
              size: 4
            }
          ]);
        }).asCallback(done);
      });

    });

  });

  describe('.extractFile()', function() {

    beforeEach(function() {
      this.zip = path.join(ZIP_PATH, 'zip-directory-nested-misc.zip');
    });

    it('should be able to extract a top-level file', function(done) {
      const fileName = 'zip-directory-nested-misc/foo';
      zipHooks.getEntries(this.zip).then((entries) => {
        return zipHooks.extractFile(this.zip, entries, fileName);
      }).then(utils.extractStream).then((data) => {
        m.chai.expect(data.toString()).to.equal('foo\n');
        done();
      });
    });

    it('should be able to extract a nested file', function(done) {
      const fileName = 'zip-directory-nested-misc/hello/there/bar';
      zipHooks.getEntries(this.zip).then((entries) => {
        return zipHooks.extractFile(this.zip, entries, fileName);
      }).then(utils.extractStream).then((data) => {
        m.chai.expect(data.toString()).to.equal('bar\n');
        done();
      });
    });

    it('should throw if the entry does not exist', function(done) {
      const fileName = 'zip-directory-nested-misc/xxxxxxxxxxxxxxxx';
      zipHooks.getEntries(this.zip).then((entries) => {
        return zipHooks.extractFile(this.zip, entries, fileName);
      }).catch((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.message).to.equal(`Invalid entry: ${fileName}`);
        done();
      });
    });

    it('should throw if the entry is a directory', function(done) {
      const fileName = 'zip-directory-nested-misc/hello';
      zipHooks.getEntries(this.zip).then((entries) => {
        return zipHooks.extractFile(this.zip, entries, fileName);
      }).catch((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.message).to.equal(`Invalid entry: ${fileName}`);
        done();
      });
    });

  });

});
