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
const fs = require('fs');
const path = require('path');
const DATA_PATH = path.join(__dirname, 'data');
const IMAGES_PATH = path.join(DATA_PATH, 'images');
const GZ_PATH = path.join(DATA_PATH, 'gz');
const imageStream = require('../../lib/image-stream/index');
const tester = require('./tester');

describe('ImageStream: GZ', function() {

  this.timeout(20000);

  describe('.getFromFilePath()', function() {

    describe('given a gz image', function() {
      tester.extractFromFilePath(
        path.join(GZ_PATH, 'etcher-test.img.gz'),
        path.join(IMAGES_PATH, 'etcher-test.img'));
    });

  });

  describe('.getImageMetadata()', function() {

    it('should return the correct metadata', function() {
      const image = path.join(GZ_PATH, 'etcher-test.img.gz');
      const uncompressedSize = fs.statSync(path.join(IMAGES_PATH, 'etcher-test.img')).size;
      const compressedSize = fs.statSync(path.join(GZ_PATH, 'etcher-test.img.gz')).size;

      return imageStream.getImageMetadata(image).then((metadata) => {
        m.chai.expect(metadata).to.deep.equal({
          path: image,
          extension: 'img',
          archiveExtension: 'gz',
          stream: null,
          size: {
            original: compressedSize,
            final: {
              estimation: true,
              value: uncompressedSize
            }
          },
          hasMBR: true,
          hasGPT: false,
          partitions: [
            {
              end: 49152,
              extended: false,
              id: null,
              name: null,
              start: 8192,
              type: 11
            },
            {
              end: 49154,
              extended: false,
              id: null,
              name: null,
              start: 49152,
              type: 131
            },
            {
              end: 49156,
              extended: false,
              id: null,
              name: null,
              start: 49154,
              type: 131
            },
            {
              end: 65536,
              extended: true,
              id: null,
              name: null,
              start: 49156,
              type: 5
            }
          ]
        });
      });
    });

  });

});
