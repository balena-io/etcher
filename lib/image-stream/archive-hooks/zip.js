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

'use strict'

const Bluebird = require('bluebird')
const _ = require('lodash')
const StreamZip = require('node-stream-zip')
const yauzl = Bluebird.promisifyAll(require('yauzl'))
const errors = require('../../shared/errors')

/**
 * @summary Get all archive entries
 * @function
 * @public
 *
 * @param {String} archive - archive path
 * @fulfil {Object[]} - archive entries
 * @returns {Promise}
 *
 * @example
 * zip.getEntries('path/to/my.zip').then((entries) => {
 *   entries.forEach((entry) => {
 *     console.log(entry.name);
 *     console.log(entry.size);
 *   });
 * });
 */
exports.getEntries = (archive) => {
  return new Bluebird((resolve, reject) => {
    const zip = new StreamZip({
      file: archive,
      storeEntries: true
    })

    zip.on('error', reject)

    zip.on('ready', () => {
      const EMPTY_ENTRY_SIZE = 0

      return resolve(_.chain(zip.entries())
        .omitBy({
          size: EMPTY_ENTRY_SIZE
        })
        .map((metadata) => {
          return {
            name: metadata.name,
            size: metadata.size
          }
        })
        .value())
    })
  })
}

/**
 * @summary Extract a file from an archive
 * @function
 * @public
 *
 * @param {String} archive - archive path
 * @param {String[]} entries - archive entries
 * @param {String} file - archive file
 * @fulfil {ReadableStream} file
 * @returns {Promise}
 *
 * @example
 * zip.getEntries('path/to/my.zip').then((entries) => {
 *   return zip.extractFile('path/to/my.zip', entries, 'my/file');
 * }).then((stream) => {
 *   stream.pipe('...');
 * });
 */
exports.extractFile = (archive, entries, file) => {
  return new Bluebird((resolve, reject) => {
    if (!_.find(entries, {
      name: file
    })) {
      throw errors.createError({
        title: `Invalid entry: ${file}`
      })
    }

    yauzl.openAsync(archive, {
      lazyEntries: true
    }).then((zipfile) => {
      zipfile.readEntry()

      zipfile.on('entry', (entry) => {
        if (entry.fileName !== file) {
          return zipfile.readEntry()
        }

        return zipfile.openReadStream(entry, (error, readStream) => {
          if (error) {
            return reject(error)
          }

          return resolve(readStream)
        })
      })
    }).catch(reject)
  })
}
