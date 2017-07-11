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

const _ = require('lodash');
const Bluebird = require('bluebird');
const MBR = require('mbr');
const GPT = require('gpt');

/**
 * @summary Maximum number of bytes to read from the stream
 * @type {Number}
 * @constant
 */
const MAX_STREAM_BYTES = 65536;

/**
 * @summary Initial number of bytes read
 * @type {Number}
 * @constant
 */
const INITIAL_LENGTH = 0;

/**
 * @summary Initial block size
 * @type {Number}
 * @constant
 */
const INITIAL_BLOCK_SIZE = 512;

/**
 * @summary Maximum block size to check for
 * @type {Number}
 * @constant
 */
const MAX_BLOCK_SIZE = 4096;

/**
 * @summary Attempt to parse the GPT from various block sizes
 * @function
 * @private
 *
 * @param {Buffer} buffer - Buffer
 * @returns {GPT|null}
 *
 * @example
 * const gpt = detectGPT(buffer);
 *
 * if (gpt != null) {
 *   // Has a GPT
 *   console.log('Partitions:', gpt.partitions);
 * }
 */
const detectGPT = (buffer) => {

  let blockSize = INITIAL_BLOCK_SIZE;
  let gpt = null;

  // Attempt to parse the GPT from several offsets,
  // as the block size of the image may vary (512,1024,2048,4096);
  // For example, ISOs will usually have a block size of 4096,
  // but raw images a block size of 512 bytes
  while (blockSize <= MAX_BLOCK_SIZE) {
    gpt = _.attempt(GPT.parse, buffer.slice(blockSize));
    if (!_.isError(gpt)) {
      return gpt;
    }
    blockSize += blockSize;
  }

  return null;

};

/**
 * @summary Attempt to parse the MBR & GPT from a given buffer
 * @function
 * @private
 *
 * @param {Object} image - Image metadata
 * @param {Buffer} buffer - Buffer
 *
 * @example
 * parsePartitionTables(image, buffer);
 *
 * if (image.hasMBR || image.hasGPT) {
 *   console.log('Partitions:', image.partitions);
 * }
 */
const parsePartitionTables = (image, buffer) => {

  const mbr = _.attempt(MBR.parse, buffer);
  let gpt = null;

  if (!_.isError(mbr)) {
    image.hasMBR = true;
    gpt = detectGPT(buffer);
    image.hasGPT = !_.isNil(gpt);
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
        firstLBA: partition.firstLBA,
        lastLBA: partition.lastLBA,
        extended: false
      };
    });
  } else if (image.hasMBR) {
    image.partitions = _.map(mbr.partitions, (partition) => {
      return {
        type: partition.type,
        id: null,
        name: null,
        firstLBA: partition.firstLBA,
        lastLBA: partition.lastLBA,
        extended: partition.extended
      };
    });
  }

};

/**
 * @summary Attempt to read the MBR and GPT from an imagestream
 * @function
 * @public
 * @description
 * This operation will consume the first `MAX_STREAM_BYTES`
 * of the stream and then destroy the stream.
 *
 * @param {Object} image - image metadata
 * @returns {Promise}
 * @fulfil {Object} image
 *
 * @example
 * parsePartitions(image)
 *   .then((image) => {
 *     console.log('MBR:', image.hasMBR);
 *     console.log('GPT:', image.hasGPT);
 *     console.log('Partitions:', image.partitions);
 *   });
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
      if (length >= MAX_STREAM_BYTES && !destroyed) {

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
        parsePartitionTables(image, Buffer.concat(chunks));
        resolve(image);

      }
    });

  });

};
