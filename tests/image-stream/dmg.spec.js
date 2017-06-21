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
const DMG_PATH = path.join(DATA_PATH, 'dmg');
const imageStream = require('../../lib/image-stream/index');
const tester = require('./tester');

describe('ImageStream: DMG', function() {

  this.timeout(20000);

  context('zlib compressed', function() {

    describe('.getFromFilePath()', function() {

      describe('given an dmg image', function() {
        tester.extractFromFilePath(
          path.join(DMG_PATH, 'etcher-test-zlib.dmg'),
          path.join(IMAGES_PATH, 'etcher-test.img'));
      });

    });

    describe('.getImageMetadata()', function() {

      it('should return the correct metadata', function() {
        const image = path.join(DMG_PATH, 'etcher-test-zlib.dmg');
        const uncompressedSize = fs.statSync(path.join(IMAGES_PATH, 'etcher-test.img')).size;
        const compressedSize = fs.statSync(image).size;

        return imageStream.getImageMetadata(image).then((metadata) => {
          m.chai.expect(metadata).to.deep.equal({
            path: image,
            extension: 'dmg',
            size: {
              original: compressedSize,
              final: {
                estimation: false,
                value: uncompressedSize
              }
            },
            hasMBR: true,
            hasGPT: false,
            partitions: require('./data/images/etcher-test-partitions.json')
          });
        });
      });

    });

  });

  context('uncompressed', function() {

    describe('.getFromFilePath()', function() {

      describe('given an dmg image', function() {
        tester.extractFromFilePath(
          path.join(DMG_PATH, 'etcher-test-raw.dmg'),
          path.join(IMAGES_PATH, 'etcher-test.img'));
      });

    });

    describe('.getImageMetadata()', function() {

      it('should return the correct metadata', function() {
        const image = path.join(DMG_PATH, 'etcher-test-raw.dmg');
        const uncompressedSize = fs.statSync(path.join(IMAGES_PATH, 'etcher-test.img')).size;
        const compressedSize = fs.statSync(image).size;

        return imageStream.getImageMetadata(image).then((metadata) => {
          m.chai.expect(metadata).to.deep.equal({
            path: image,
            extension: 'dmg',
            size: {
              original: compressedSize,
              final: {
                estimation: false,
                value: uncompressedSize
              }
            },
            hasMBR: true,
            hasGPT: false,
            partitions: require('./data/images/etcher-test-partitions.json')
          });
        });
      });

    });

  });

  context('invalid', function() {

    describe('given an invalid dmg file', function() {
      tester.expectError(
        path.join(DATA_PATH, 'unrecognized', 'invalid.dmg'),
        'Invalid image', 'Invalid footer');
    });

  });

});
