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

/* eslint-disable jsdoc/require-example */

const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const PassThroughStream = require('stream').PassThrough;
const lzma = Bluebird.promisifyAll(require('lzma-native'));
const zlib = require('zlib');
const unbzip2Stream = require('unbzip2-stream');
const gzip = require('./gzip');
const udif = Bluebird.promisifyAll(require('udif'));
const archive = require('./archive');
const zipArchiveHooks = require('./archive-hooks/zip');
const fileExtensions = require('../shared/file-extensions');
const path = require('path');
const errors = require('../shared/errors');

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
   * @param {String} imagePath - image path
   * @param {Object} options - options
   * @param {Number} [options.size] - image size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/x-bzip2': (imagePath, options) => {
    return Bluebird.props({
      path: imagePath,
      archiveExtension: fileExtensions.getLastFileExtension(imagePath),
      extension: fileExtensions.getPenultimateFileExtension(imagePath),
      stream: fs.createReadStream(imagePath),
      size: {
        original: options.size,
        final: {
          estimation: true,
          value: options.size
        }
      },
      transform: unbzip2Stream()
    });
  },

  /**
   * @summary Handle GZ compressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} imagePath - image path
   * @param {Object} options - options
   * @param {Number} [options.size] - image size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/gzip': (imagePath, options) => {
    return gzip.getUncompressedSize(imagePath).then((uncompressedSize) => {
      return Bluebird.props({
        path: imagePath,
        archiveExtension: fileExtensions.getLastFileExtension(imagePath),
        extension: fileExtensions.getPenultimateFileExtension(imagePath),
        stream: fs.createReadStream(imagePath),
        size: {
          original: options.size,
          final: {
            estimation: true,
            value: uncompressedSize
          }
        },
        transform: zlib.createGunzip()
      });
    });
  },

  /**
   * @summary Handle XZ compressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} imagePath - image path
   * @param {Object} options - options
   * @param {Number} [options.size] - image size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/x-xz': (imagePath, options) => {
    return fs.openAsync(imagePath, 'r').then((fileDescriptor) => {
      return lzma.parseFileIndexFDAsync(fileDescriptor).tap(() => {
        return fs.closeAsync(fileDescriptor);
      });
    }).then((metadata) => {
      return {
        path: imagePath,
        archiveExtension: fileExtensions.getLastFileExtension(imagePath),
        extension: fileExtensions.getPenultimateFileExtension(imagePath),
        stream: fs.createReadStream(imagePath),
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
   * @summary Handle Apple disk images (.dmg)
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} imagePath - image path
   * @param {Object} options - options
   * @param {Number} [options.size] - image size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/x-apple-diskimage': (imagePath, options) => {
    return udif.getUncompressedSizeAsync(imagePath).then((size) => {
      return {
        path: imagePath,
        extension: fileExtensions.getLastFileExtension(imagePath),
        stream: udif.createReadStream(imagePath),
        size: {
          // FIXME(jhermsmeier): Originally `options.size`,
          // See discussion in https://github.com/resin-io/etcher/pull/1587
          original: size || options.size,
          final: {
            estimation: false,
            value: size
          }
        },
        transform: new PassThroughStream()
      };
    }).catch((error) => {
      if (/invalid footer/i.test(error.message)) {
        throw errors.createUserError({
          title: 'Invalid image',
          description: `There was an error reading "${path.basename(imagePath)}". `
            + 'The image does not appear to be a valid Apple Disk Image (dmg), or may have the wrong filename extension.\n\n'
            + `Error: ${error.description || error.message}`
        });
      }
      throw error;
    });
  },

  /**
   * @summary Handle ZIP compressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} imagePath - image path
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/zip': (imagePath) => {
    return archive.extractImage(imagePath, zipArchiveHooks);
  },

  /**
   * @summary Handle plain uncompressed images
   * @function
   * @public
   * @memberof handlers
   *
   * @param {String} imagePath - image path
   * @param {Object} options - options
   * @param {Number} [options.size] - image size
   *
   * @fulfil {Object} - image metadata
   * @returns {Promise}
   */
  'application/octet-stream': (imagePath, options) => {
    return Bluebird.props({
      path: imagePath,
      extension: fileExtensions.getLastFileExtension(imagePath),
      stream: fs.createReadStream(imagePath),
      size: {
        original: options.size,
        final: {
          estimation: false,
          value: options.size
        }
      },
      transform: new PassThroughStream()
    });
  }

};
