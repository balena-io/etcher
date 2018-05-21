/*
 * Copyright 2018 resin.io
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

const _ = require('lodash')
const path = require('path')
const Bluebird = require('bluebird')
const fs = Bluebird.promisifyAll(require('fs'))

/* eslint-disable lodash/prefer-lodash-method */

/**
 * @summary Async exists function
 * @function
 * @public
 *
 * @description
 * This is a promise for convenience, as it never fails with an exception/catch.
 *
 * @param {String} fullpath - full path
 * @returns {Boolean}
 *
 * @example
 * files.existsAsync('/home/user/file').then(console.log)
 * > true
 */
exports.existsAsync = (fullpath) => {
  return new Bluebird((resolve, reject) => {
    return fs.accessAsync(fullpath, fs.constants.F_OK).then(() => {
      resolve(true)
    }).catch(() => {
      resolve(false)
    })
  })
}

/**
 * @summary Get file metadata
 * @function
 * @private
 *
 * @param {String} dirname - directory name
 * @param {String} [basename] - custom basename to append
 * @returns {Object} file metadata
 *
 * @example
 * try {
 *   const file = files.getFileMetadataSync('/home/user')
 *   console.log(`Is ${file.basename} a directory? ${file.isDirectory}`)
 * } catch (error) {
 *   console.error(error)
 * }
 */
exports.getFileMetadataSync = (dirname, basename = '') => {
  // TODO(Shou): use path.parse object information here
  const fullpath = path.join(dirname, basename)
  const pathObj = path.parse(fullpath)

  // TODO(Shou): this is not true for Windows, figure out Windows hidden files
  const isHidden = pathObj.base.startsWith('.')
  const stats = fs.statSync(fullpath)

  return {
    basename: pathObj.base,
    dirname: pathObj.dir,
    fullpath,
    extension: pathObj.ext,
    name: pathObj.name,
    isDirectory: stats.isDirectory(),
    isHidden,
    size: stats.size
  }
}

/**
 * @summary Get file metadata asynchronously
 * @function
 * @private
 *
 * @param {String} fullpath - full path
 * @returns {Promise<Object>} promise of file metadata
 *
 * @example
 * files.getFileMetadataAsync('/home/user').then((file) => {
 *   console.log(`Is ${file.basename} a directory? ${file.isDirectory}`)
 * })
 */
exports.getFileMetadataAsync = (fullpath) => {
  const pathObj = path.parse(fullpath)

  // NOTE(Shou): this is not true for Windows
  const isHidden = pathObj.base.startsWith('.')

  return fs.statAsync(fullpath).then((stats) => {
    return {
      basename: pathObj.base,
      dirname: pathObj.dir,
      fullpath,
      extension: pathObj.ext,
      name: pathObj.name,
      isDirectory: stats.isDirectory(),
      isHidden,
      size: stats.size
    }
  })
}

/**
 * @summary Get file metadata for a list of filenames
 * @function
 * @public
 *
 * @description Note that this omits any file that errors
 *
 * @param {String} dirname - directory path
 * @param {Array<String>} basenames - file names
 * @returns {Promise<Array<Object>>} promise of file objects
 *
 * @example
 * files.getAllFilesMetadataAsync(os.homedir(), [ 'file1.txt', 'file2.txt' ])
 */
exports.getAllFilesMetadataAsync = (dirname, basenames) => {
  return Bluebird.reduce(basenames, (fileMetas, basename) => {
    return new Bluebird((resolve, reject) => {
      exports.getFileMetadataAsync(path.join(dirname, basename)).then((metadata) => {
        resolve(fileMetas.concat(metadata))
      }).catch(() => {
        resolve(fileMetas)
      })
    })
  }, [])
}

/**
 * @summary Split a path on it's separator(s)
 * @function
 * @public
 *
 * @param {String} fullpath - full path to split
 * @param {Array<String>} [subpaths] - this param shouldn't normally be used
 * @returns {Array<String>}
 *
 * @example
 * console.log(splitPath(path.join(os.homedir(), 'Downloads'))
 * // Linux
 * > [ '/', 'home', 'user', 'Downloads' ]
 * // Windows
 * > [ 'C:', 'Users', 'user', 'Downloads' ]
 */
exports.splitPath = (fullpath, subpaths = []) => {
  const {
    base,
    dir,
    root
  } = path.parse(fullpath)
  const isAbsolute = path.isAbsolute(fullpath)

  // Takes care of 'relative/path'
  if (!isAbsolute && dir === '') {
    return [ base ].concat(subpaths)

  // Takes care of '/'
  } else if (isAbsolute && base === '') {
    return [ root ].concat(subpaths)
  }

  return exports.splitPath(dir, [ base ].concat(subpaths))
}

/**
 * @summary Get all subpaths contained in a path
 * @function
 * @private
 *
 * @param {String} fullpath - path string
 * @returns {Array<Object>} - all subpaths as file objects
 *
 * @example
 * const subpaths = files.subpaths('/home/user/Downloads')
 * console.log(subpaths.map(file => file.fullpath))
 * // Linux/macOS
 * > [ '/', '/home', '/home/user', '/home/user/Downloads' ]
 * // Windows
 * > [ 'C:', 'Users', 'user', 'Downloads' ]
 */
exports.subpaths = (fullpath) => {
  if (!_.isString(fullpath)) {
    return null
  }

  const dirs = exports.splitPath(fullpath)

  return _.map(dirs, (dir, index) => {
    // eslint-disable-next-line no-magic-numbers
    const subdir = dirs.slice(0, index + 1)
    return exports.getFileMetadataSync(path.join(...subdir))
  })
}
