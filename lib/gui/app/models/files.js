/*
 * Copyright 2018 balena.io
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
const fs = Bluebird.promisifyAll(require('fs'))
const path = require('path')

// eslint-disable-next-line node/no-missing-require
const { scanner: driveScanner } = require('../modules/drive-scanner')

/* eslint-disable lodash/prefer-lodash-method */
/* eslint-disable no-undefined */

const CONCURRENCY = 10

const collator = new Intl.Collator(undefined, {
  sensitivity: 'case'
})

/**
 * @summary Sort files by their names / stats
 * @param {FileEntry} fileA - first file
 * @param {FileEntry} fileB - second file
 * @returns {Number}
 *
 * @example
 * files.readdirAsync(dirname).then((files) => {
 *   return files.sort(sortFiles)
 * })
 */
const sortFiles = (fileA, fileB) => {
  return (fileB.isDirectory - fileA.isDirectory) ||
    collator.compare(fileA.basename, fileB.basename)
}

/**
 * @summary FileEntry struct
 * @class
 * @type {FileEntry}
 */
class FileEntry {
  /**
   * @summary FileEntry
   * @param {String} filename - filename
   * @param {fs.Stats} stats - stats
   *
   * @example
   * new FileEntry(filename, stats)
   */
  constructor (filename, stats) {
    const components = path.parse(filename)

    this.path = filename
    this.dirname = components.dir
    this.basename = components.base
    this.name = components.name
    this.ext = components.ext
    this.isHidden = components.name.startsWith('.')
    this.isFile = stats.isFile()
    this.isDirectory = stats.isDirectory()
    this.size = stats.size
  }
}

/**
 * @summary Read a directory & stat all contents
 * @param {String} dirpath - Directory path
 * @returns {Array<FileEntry>}
 *
 * @example
 * files.readdirAsync('/').then((files) => {
 *   // ...
 * })
 */
exports.readdirAsync = (dirpath) => {
  console.time('readdirAsync')
  const dirname = path.resolve(dirpath)
  return fs.readdirAsync(dirname).then((ls) => {
    return ls.filter((filename) => {
      return !filename.startsWith('.')
    }).map((filename) => {
      return path.join(dirname, filename)
    })
  }).map((filename, index, length) => {
    return fs.statAsync(filename).then((stats) => {
      return new FileEntry(filename, stats)
    })
  }, { concurrency: CONCURRENCY }).then((files) => {
    console.timeEnd('readdirAsync')
    return files.sort(sortFiles)
  })
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
 * @summary Get constraint path device
 * @param {String} pathname - device path
 * @returns {Drive} drive - drive object
 * @example
 * const device = files.getConstraintDevice('/dev/disk2')
 */
exports.getConstraintDevice = (pathname) => {
  // This supposes the drive scanner is ready
  return driveScanner.getBy('device', pathname) || driveScanner.getBy('devicePath', pathname)
}

exports.FileEntry = FileEntry
