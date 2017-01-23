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
const DATA_PATH = path.join(__dirname, '..', 'data');
const IMAGES_PATH = path.join(DATA_PATH, 'images');
const ZIP_PATH = path.join(DATA_PATH, 'metadata', 'zip');
const tester = require('../tester');
const imageStream = require('../../../lib/image-stream/index');

const testMetadataProperty = (archivePath, propertyName, expectedValue) => {
  return imageStream.getFromFilePath(archivePath).then((image) => {
    m.chai.expect(image[propertyName]).to.deep.equal(expectedValue);

    return imageStream.getImageMetadata(archivePath).then((metadata) => {
      m.chai.expect(metadata[propertyName]).to.deep.equal(expectedValue);
    });
  });
};

describe('ImageStream: Metadata ZIP', function() {

  this.timeout(10000);

  describe('given an archive with an invalid `manifest.json`', function() {

    tester.expectError(
      path.join(ZIP_PATH, 'rpi-invalid-manifest.zip'),
      'Invalid archive manifest.json');

    describe('.getImageMetadata()', function() {

      it('should be rejected with an error', function(done) {
        const image = path.join(ZIP_PATH, 'rpi-invalid-manifest.zip');

        imageStream.getImageMetadata(image).catch((error) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('Invalid archive manifest.json');
          done();
        });
      });

    });

  });

  describe('given an archive with a `manifest.json`', function() {

    const archive = path.join(ZIP_PATH, 'rpi-with-manifest.zip');

    tester.extractFromFilePath(
      archive,
      path.join(IMAGES_PATH, 'raspberrypi.img'));

    it('should read the manifest name property', function(done) {
      testMetadataProperty(archive, 'name', 'Raspberry Pi').asCallback(done);
    });

    it('should read the manifest version property', function(done) {
      testMetadataProperty(archive, 'version', '1.0.0').asCallback(done);
    });

    it('should read the manifest url property', function(done) {
      testMetadataProperty(archive, 'url', 'https://www.raspberrypi.org').asCallback(done);
    });

    it('should read the manifest supportUrl property', function(done) {
      const expectedValue = 'https://www.raspberrypi.org/forums/';
      testMetadataProperty(archive, 'supportUrl', expectedValue).asCallback(done);
    });

    it('should read the manifest releaseNotesUrl property', function(done) {
      const expectedValue = 'http://downloads.raspberrypi.org/raspbian/release_notes.txt';
      testMetadataProperty(archive, 'releaseNotesUrl', expectedValue).asCallback(done);
    });

    it('should read the manifest checksumType property', function(done) {
      testMetadataProperty(archive, 'checksumType', 'md5').asCallback(done);
    });

    it('should read the manifest checksum property', function(done) {
      testMetadataProperty(archive, 'checksum', 'add060b285d512f56c175b76b7ef1bee').asCallback(done);
    });

    it('should read the manifest bytesToZeroOutFromTheBeginning property', function(done) {
      testMetadataProperty(archive, 'bytesToZeroOutFromTheBeginning', 512).asCallback(done);
    });

    it('should read the manifest recommendedDriveSize property', function(done) {
      testMetadataProperty(archive, 'recommendedDriveSize', 4294967296).asCallback(done);
    });

  });

  describe('given an archive with a `logo.svg`', function() {

    const archive = path.join(ZIP_PATH, 'rpi-with-logo.zip');

    const logo = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '  <text>Hello World</text>',
      '</svg>',
      ''
    ].join('\n');

    it('should read the logo contents', function(done) {
      testMetadataProperty(archive, 'logo', logo).asCallback(done);
    });

  });

  describe('given an archive with a bmap file', function() {

    const archive = path.join(ZIP_PATH, 'rpi-with-bmap.zip');

    const bmap = [
      '<?xml version="1.0" ?>',
      '<bmap version="1.3">',
      '    <ImageSize> 36864 </ImageSize>',
      '    <BlockSize> 4096 </BlockSize>',
      '    <BlocksCount> 9 </BlocksCount>',
      '    <MappedBlocksCount> 4     </MappedBlocksCount>',
      '    <BmapFileSHA1> d90f372215cbbef8801caca7b1dd7e587b2142cc </BmapFileSHA1>',
      '    <BlockMap>',
      '        <Range sha1="193edb53bde599f58369f4e83a6c5d54b96819ce"> 0-1 </Range>',
      '        <Range sha1="193edb53bde599f58369f4e83a6c5d54b96819ce"> 7-8 </Range>',
      '    </BlockMap>',
      '</bmap>',
      ''
    ].join('\n');

    it('should read the bmap contents', function(done) {
      testMetadataProperty(archive, 'bmap', bmap).asCallback(done);
    });

  });

  describe('given an archive with instructions', function() {

    const archive = path.join(ZIP_PATH, 'rpi-with-instructions.zip');

    const instructions = [
      '# Raspberry Pi Next Steps',
      '',
      'Lorem ipsum dolor sit amet.',
      ''
    ].join('\n');

    it('should read the instruction contents', function(done) {
      testMetadataProperty(archive, 'instructions', instructions).asCallback(done);
    });

  });

});
