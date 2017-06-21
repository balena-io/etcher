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
const imageStream = require('../../lib/image-stream/index');
const tester = require('./tester');

describe('ImageStream: ISO', function() {

  this.timeout(20000);

  describe('.getFromFilePath()', function() {

    describe('given an iso image', function() {
      tester.extractFromFilePath(
        path.join(IMAGES_PATH, 'etcher-test.iso'),
        path.join(IMAGES_PATH, 'etcher-test.iso'));
    });

  });

  describe('.getImageMetadata()', function() {

    it('should return the correct metadata', function() {
      const image = path.join(IMAGES_PATH, 'etcher-test.iso');
      const expectedSize = fs.statSync(image).size;

      return imageStream.getImageMetadata(image).then((metadata) => {
        m.chai.expect(metadata).to.deep.equal({
          path: image,
          extension: 'iso',
          size: {
            original: expectedSize,
            final: {
              estimation: false,
              value: expectedSize
            }
          },
          hasMBR: true,
          hasGPT: false,
          partitions: require('./data/images/etcher-test-partitions')
        });
      });
    });

  });

});
