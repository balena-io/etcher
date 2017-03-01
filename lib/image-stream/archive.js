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

const path = require('path');
const Bluebird = require('bluebird');
const rindle = require('rindle');
const _ = require('lodash');
const PassThroughStream = require('stream').PassThrough;
const supportedFileTypes = require('./supported');

/**
 * @summary Archive metadata base path
 * @constant
 * @private
 * @type {String}
 */
const ARCHIVE_METADATA_BASE_PATH = '.meta';

/**
 * @summary Image extensions
 * @constant
 * @private
 * @type {String[]}
 */
const IMAGE_EXTENSIONS = _.reduce(supportedFileTypes, (accumulator, file) => {
  if (file.type === 'image') {
    accumulator.push(file.extension);
  }

  return accumulator;
}, []);

/**
 * @summary Extract entry by path
 * @function
 * @private
 *
 * @param {String} archive - archive
 * @param {String} filePath - entry file path
 * @param {Object} options - options
 * @param {Object} options.hooks - archive hooks
 * @param {Object[]} options.entries - archive entries
 * @param {*} [options.default] - entry default value
 * @fulfil {*} contents
 * @returns {Promise}
 *
 * extractEntryByPath('my/archive.zip', '_info/logo.svg', {
 *   hooks: { ... },
 *   entries: [ ... ],
 *   default: ''
 * }).then((contents) => {
 *   console.log(contents);
 * });
 */
const extractEntryByPath = (archive, filePath, options) => {
  const fileEntry = _.find(options.entries, (entry) => {
    return _.chain(entry.name)
      .split('/')
      .tail()
      .join('/')
      .value() === filePath;
  });

  if (!fileEntry) {
    return Bluebird.resolve(options.default);
  }

  return options.hooks.extractFile(archive, options.entries, fileEntry.name)
    .then(rindle.extract);
};

/**
 * @summary Extract archive metadata
 * @function
 * @private
 *
 * @param {String} archive - archive
 * @param {String} basePath - metadata base path
 * @param {Object} options - options
 * @param {Object[]} options.entries - archive entries
 * @param {Object} options.hooks - archive hooks
 * @fulfil {Object} - metadata
 * @returns {Promise}
 *
 * extractArchiveMetadata('my/archive.zip', '.meta', {
 *   hooks: { ... },
 *   entries: [ ... ]
 * }).then((metadata) => {
 *   console.log(metadata);
 * });
 */
const extractArchiveMetadata = (archive, basePath, options) => {
  return Bluebird.props({
    logo: extractEntryByPath(archive, `${basePath}/logo.svg`, options),
    instructions: extractEntryByPath(archive, `${basePath}/instructions.markdown`, options),
    bmap: extractEntryByPath(archive, `${basePath}/image.bmap`, options),
    manifest: _.attempt(() => {
      return extractEntryByPath(archive, `${basePath}/manifest.json`, {
        hooks: options.hooks,
        entries: options.entries,
        default: '{}'
      }).then((manifest) => {
        try {
          return JSON.parse(manifest);
        } catch (parseError) {
          const error = new Error('Invalid archive manifest.json');
          error.description = 'The archive manifest.json file is not valid JSON.';
          throw error;
        }
      });
    })
  }).then((results) => {
    return {
      name: results.manifest.name,
      version: results.manifest.version,
      url: results.manifest.url,
      supportUrl: results.manifest.supportUrl,
      releaseNotesUrl: results.manifest.releaseNotesUrl,
      checksumType: results.manifest.checksumType,
      checksum: results.manifest.checksum,
      bytesToZeroOutFromTheBeginning: results.manifest.bytesToZeroOutFromTheBeginning,
      recommendedDriveSize: results.manifest.recommendedDriveSize,
      logo: results.logo,
      bmap: results.bmap,
      instructions: results.instructions
    };
  });
};

/**
 * @summary Extract image from archive
 * @function
 * @public
 *
 * @param {String} archive - archive path
 * @param {Object} hooks - archive hooks
 * @param {Function} hooks.getEntries - get entries hook
 * @param {Function} hooks.extractFile - extract file hook
 * @fulfil {Object} image metadata
 * @returns {Promise}
 *
 * @example
 * archive.extractImage('path/to/my/archive.zip', {
 *   getEntries: (archive) => {
 *     return [ ..., ..., ... ];
 *   },
 *   extractFile: (archive, entries, file) => {
 *     ...
 *   }
 * }).then((image) => {
 *   image.stream.pipe(image.transform).pipe(...);
 * });
 */
exports.extractImage = (archive, hooks) => {
  return hooks.getEntries(archive).then((entries) => {

    const imageEntries = _.filter(entries, (entry) => {
      const extension = path.extname(entry.name).slice(1);
      return _.includes(IMAGE_EXTENSIONS, extension);
    });

    if (imageEntries.length !== 1) {
      const error = new Error('Invalid archive image');
      error.description = 'The archive image should contain one and only one top image file.';
      error.report = false;
      throw error;
    }

    const imageEntry = _.first(imageEntries);

    return Bluebird.props({
      imageStream: hooks.extractFile(archive, entries, imageEntry.name),
      metadata: extractArchiveMetadata(archive, ARCHIVE_METADATA_BASE_PATH, {
        entries,
        hooks
      })
    }).then((results) => {
      results.metadata.stream = results.imageStream;
      results.metadata.transform = new PassThroughStream();

      results.metadata.size = {
        original: imageEntry.size,
        final: {
          estimation: false,
          value: imageEntry.size
        }
      };

      return results.metadata;
    });
  });
};
