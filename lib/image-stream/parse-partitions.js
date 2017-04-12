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

const MAX_BYTES = 8192;
const INITIAL_LENGTH = 0;
const INITIAL_BLOCK_SIZE = 512;
const MAX_BLOCK_SIZE = 4096;

/**
 * Attempt to parse the GPT from various block sizes
 * @private
 * @param {Buffer} buffer - Buffer
 * @returns {GPT|null}
 */
const parseGPT = (buffer) => {

  let blockSize = INITIAL_BLOCK_SIZE;
  let gpt = null;

  // Attempt to parse the GPT from several offsets,
  // as the block size of the image may vary (512,1024,2048,4096);
  // For example, ISOs will usually have a block size of 4096,
  // but raw images a block size of 512 bytes
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
 * Attempt to parse the MBR & GPT from a given buffer
 * @private
 * @param {Object} image - Image metadata
 * @param {Buffer} buffer - Buffer
 * @returns {undefined}
 */
const parsePartitions = (image, buffer) => {

  let mbr = null;
  let gpt = null;

  try {
    mbr = MBR.parse(buffer);
    image.hasMBR = true;
    if (mbr.getEFIPart()) {
      image.hasGPT = true;
      gpt = parseGPT(buffer);
    }
  } catch (error) {
    // Ignore error
  }

  // As MBR and GPT partition entries have a different structure,
  // we normalize them here to make them easier to deal with and
  // avoid clutter in what's sent to analytics
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

    const chunks = [];
    let length = INITIAL_LENGTH;
    let destroyed = false;

    image.hasMBR = false;
    image.hasGPT = false;

    let stream = image.stream.pipe(image.transform);

    stream.on('error', reject);

    // We need to use the "old" flowing mode here,
    // as some dependencies don't implement the "readable"
    // mode properly (i.e. bzip2)
    stream.on('data', (chunk) => {
      chunks.push(chunk);
      length += chunk.length;

      // Once we've read enough bytes, terminate the stream
      if (length >= MAX_BYTES && !destroyed) {

        // Prefer close() over destroy(), as some streams
        // from dependencies exhibit quirky behavior when destroyed
        if (image.stream.close) {
          image.stream.close();
        } else {
          image.stream.destroy();
        }

        // Remove references to stream to allow them being GCed
        image.stream = null;
        image.transform = null;
        stream = null;
        destroyed = true;

        // Parse the MBR, GPT and partitions from the obtained buffer
        parsePartitions(image, Buffer.concat(chunks));
        resolve(image);

      }
    });

  });

};
