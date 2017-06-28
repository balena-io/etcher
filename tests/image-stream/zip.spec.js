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
const ZIP_PATH = path.join(DATA_PATH, 'zip');
const imageStream = require('../../lib/image-stream/index');
const tester = require('./tester');

describe('ImageStream: ZIP', function() {

  this.timeout(20000);

  describe('.getFromFilePath()', function() {

    describe('given an empty zip directory', function() {
      tester.expectError(
        path.join(ZIP_PATH, 'zip-directory-empty.zip'),
        'Invalid archive image');
    });

    describe('given a zip directory containing only misc files', function() {
      tester.expectError(
        path.join(ZIP_PATH, 'zip-directory-no-image-only-misc.zip'),
        'Invalid archive image');
    });

    describe('given a zip with an unsupported compression method', function() {
      tester.expectError(
        path.join(ZIP_PATH, 'zip-deflate64.zip'),
        'unsupported compression method: 9');
    });

    describe('given a zip directory containing multiple images', function() {
      tester.expectError(
        path.join(ZIP_PATH, 'zip-directory-multiple-images.zip'),
        'Invalid archive image');
    });

    describe('given a zip directory containing only an image', function() {
      tester.extractFromFilePath(
        path.join(ZIP_PATH, 'zip-directory-etcher-test-only.zip'),
        path.join(IMAGES_PATH, 'etcher-test.img'));
    });

    describe('given a zip directory containing an image and other misc files', function() {
      tester.extractFromFilePath(
        path.join(ZIP_PATH, 'zip-directory-etcher-test-and-misc.zip'),
        path.join(IMAGES_PATH, 'etcher-test.img'));
    });

  });

  describe('.getImageMetadata()', function() {

    it('should return the correct metadata', function() {
      const image = path.join(ZIP_PATH, 'zip-directory-etcher-test-only.zip');
      const expectedSize = fs.statSync(path.join(IMAGES_PATH, 'etcher-test.img')).size;

      return imageStream.getImageMetadata(image).then((metadata) => {
        m.chai.expect(metadata).to.deep.equal({
          path: image,
          extension: 'img',
          archiveExtension: 'zip',
          size: {
            original: expectedSize,
            final: {
              estimation: false,
              value: expectedSize
            }
          }
        });
      });
    });

  });

});
