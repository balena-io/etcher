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
const DATA_PATH = path.join(__dirname, 'data');
const utils = require('../../lib/image-stream/utils');

describe('ImageStream: Utils', function() {

  describe('.getArchiveMimeType()', function() {

    it('should return application/x-bzip2 for a bz2 archive', function() {
      const file = path.join(DATA_PATH, 'bz2', 'raspberrypi.img.bz2');
      m.chai.expect(utils.getArchiveMimeType(file)).to.equal('application/x-bzip2');
    });

    it('should return application/x-xz for a xz archive', function() {
      const file = path.join(DATA_PATH, 'xz', 'raspberrypi.img.xz');
      m.chai.expect(utils.getArchiveMimeType(file)).to.equal('application/x-xz');
    });

    it('should return application/gzip for a gz archive', function() {
      const file = path.join(DATA_PATH, 'gz', 'raspberrypi.img.gz');
      m.chai.expect(utils.getArchiveMimeType(file)).to.equal('application/gzip');
    });

    it('should return application/zip for a zip archive', function() {
      const file = path.join(DATA_PATH, 'zip', 'zip-directory-rpi-only.zip');
      m.chai.expect(utils.getArchiveMimeType(file)).to.equal('application/zip');
    });

    it('should return application/octet-stream for an uncompress image', function() {
      const file = path.join(DATA_PATH, 'images', 'raspberrypi.img');
      m.chai.expect(utils.getArchiveMimeType(file)).to.equal('application/octet-stream');
    });

  });

});
