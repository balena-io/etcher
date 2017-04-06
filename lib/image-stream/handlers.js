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

const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const PassThroughStream = require('stream').PassThrough;
const lzma = Bluebird.promisifyAll(require('lzma-native'));
const zlib = require('zlib');
const unbzip2Stream = require('unbzip2-stream');
const gzip = require('./gzip');
const archive = require('./archive');
const zipArchiveHooks = require('./archive-hooks/zip');

/**
 * @summary Image handlers
 * @namespace handlers
 * @public
 */
module.exports = {

  /**
   * @summary Handle BZ2 compressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} file - file path
   * @param {Object} options - options
   * @param {Number} [options.size] - file size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/x-bzip2': (file, options) => {
    return Bluebird.props({
      path: file,
      stream: fs.createReadStream(file),
      size: {
        original: options.size,
        final: {
          estimation: true,
          value: options.size
        }
      },
      transform: Bluebird.resolve(unbzip2Stream())
    });
  },

  /**
   * @summary Handle GZ compressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} file - file path
   * @param {Object} options - options
   * @param {Number} [options.size] - file size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/gzip': (file, options) => {
    return gzip.getUncompressedSize(file).then((uncompressedSize) => {
      return Bluebird.props({
        path: file,
        stream: fs.createReadStream(file),
        size: {
          original: options.size,
          final: {
            estimation: true,
            value: uncompressedSize
          }
        },
        transform: Bluebird.resolve(zlib.createGunzip())
      });
    });
  },

  /**
   * @summary Handle XZ compressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} file - file path
   * @param {Object} options - options
   * @param {Number} [options.size] - file size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/x-xz': (file, options) => {
    return fs.openAsync(file, 'r').then((fileDescriptor) => {
      return lzma.parseFileIndexFDAsync(fileDescriptor).tap(() => {
        return fs.closeAsync(fileDescriptor);
      });
    }).then((metadata) => {
      return {
        path: file,
        stream: fs.createReadStream(file),
        size: {
          original: options.size,
          final: {
            estimation: false,
            value: metadata.uncompressedSize
          }
        },
        transform: lzma.createDecompressor()
      };
    });
  },

  /**
   * @summary Handle ZIP compressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} file - file path
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/zip': (file) => {
    return archive.extractImage(file, zipArchiveHooks);
  },

  /**
   * @summary Handle plain uncompressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} file - file path
   * @param {Object} options - options
   * @param {Number} [options.size] - file size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/octet-stream': (file, options) => {
    return Bluebird.props({
      path: file,
      stream: fs.createReadStream(file),
      size: {
        original: options.size,
        final: {
          estimation: false,
          value: options.size
        }
      },
      transform: Bluebird.resolve(new PassThroughStream())
    });
  }

};
