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

const _ = require('lodash');
const Bluebird = require('bluebird');
const MBR = require('mbr');
const GPT = require('gpt');

const MAX_BYTES = 65536;
const INITIAL_LENGTH = 0;
const INITIAL_BLOCK_SIZE = 512;
const MAX_BLOCK_SIZE = 8192;

/**
 * Attempt to parse the GPT from various block sizes
 * @private
 * @param {Buffer} buffer - Buffer
 * @returns {GPT|null}
 */
const parseGPT = (buffer) => {

  let blockSize = INITIAL_BLOCK_SIZE;
  let gpt = null;

  while (blockSize <= MAX_BLOCK_SIZE) {
    try {
      gpt = GPT.parse(buffer.slice(blockSize));
    } catch (error) {
      // Ignore error
    }
    if (gpt) {
      return gpt;
    }
    blockSize += blockSize;
  }

  return gpt;

};

/**
 * Attempt to read the MBR and GPT from an imagestream
 * NOTE: This operation will consume the first `MAX_BYTES`
 * of the stream and then destroy the stream.
 * @param {Object} image - image metadata
 * @returns {Promise}
 */
module.exports = (image) => {
  return new Bluebird((resolve, reject) => {

    let chunks = [];
    let length = INITIAL_LENGTH;
    let destroyed = false;
    let data = null;
    let mbr = null;
    let gpt = null;

    image.stream.on('error', reject);
    image.stream.on('readable', function() {
      // Stop reading once we've read `MAX_BYTES`
      // and attempt to parse the MBR (and GPT if available)
      if (length >= MAX_BYTES) {
        // Destroy the stream to prevent dangling
        // file descriptors and use after destroy
        if (!destroyed) {
          this.destroy();
          image.stream = null;
          image.hasMBR = false;
          image.hasGPT = false;
          destroyed = true;

          data = Buffer.concat(chunks);
          chunks = null;

          try {
            mbr = MBR.parse(data);
            image.hasMBR = true;
            if (mbr.getEFIPart()) {
              image.hasGPT = true;
              gpt = parseGPT(data);
            }
          } catch (error) {
            // Ignore error
          }

          if (image.hasGPT) {
            image.partitions = _.map(gpt.partitions, (partition) => {
              return {
                type: partition.type.toString(),
                id: partition.guid.toString(),
                name: partition.name,
                start: partition.firstLBA,
                end: partition.lastLBA,
                extended: false
              };
            });
          } else if (image.hasMBR) {
            image.partitions = _.map(mbr.partitions, (partition) => {
              return {
                type: partition.type,
                id: null,
                name: null,
                start: partition.firstLBA,
                end: partition.lastLBA,
                extended: partition.extended
              };
            });
          }

          resolve(image);
        }
        return;
      }

      // Read chunks
      let chunk = this.read();
      while (chunk) {
        chunks.push(chunk);
        length += chunk.length;
        chunk = this.read();
      }
    });
  });

};
