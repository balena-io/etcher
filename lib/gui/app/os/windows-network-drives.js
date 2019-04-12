/*
 * Copyright 2019 resin.io
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
const cp = require('child_process')
const fs = require('fs')
const _ = require('lodash')
const os = require('os')
const Path = require('path')
const process = require('process')
const tmp = require('tmp')
const { promisify } = require('util')

/**
 * @summary returns { path: String, cleanup: Function }
 * @function
 *
 * @returns {Promise<{ path: String, cleanup: Function }>}
 *
 * @example
 * tmpFileAsync()
 *   .then({ path, cleanup } => {
 *     console.log(path)
 *     cleanup()
 *   });
 */
const tmpFileAsync = () => {
  return new Promise((resolve, reject) => {
    const options = {

      // Close the file once it's created
      discardDescriptor: true,

      // Wmic fails with "Invalid global switch" when the "/output:" switch filename contains a dash ("-")
      prefix: 'tmp'
    }
    tmp.file(options, (error, path, _fd, cleanup) => {
      if (error) {
        reject(error)
      } else {
        resolve({ path, cleanup })
      }
    })
  })
}

/**
 * @summary Disposer for tmpFileAsync, calls cleanup()
 * @function
 *
 * @returns {Disposer<{ path: String, cleanup: Function }>}
 *
 * @example
 * await Bluebird.using(tmpFileDisposer(), ({ path }) => {
 *   console.log(path);
 * })
 */
const tmpFileDisposer = () => {
  return Bluebird.resolve(tmpFileAsync())
    .disposer(({ cleanup }) => {
      cleanup()
    })
}

const readFileAsync = promisify(fs.readFile)

/**
 * @summary Promisified child_process.execFile
 * @function
 *
 * @param {String} file - command
 * @param {String[]} args - arguments
 * @param {Object} options - child_process.execFile options
 *
 * @returns {Promise<Object>} - { stdout, stderr }
 *
 * @example
 * execFileAsync('ls', [ '.' ])
 *   .then(console.log);
 */
const execFileAsync = async (file, args, options) => {
  return new Promise((resolve, reject) => {
    cp.execFile(
      file,
      args,
      options,
      (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          resolve({ stdout, stderr })
        }
      }
    )
  })
}

/**
 * @summary Returns wmic's output for network drives
 * @function
 *
 * @returns {Promise<String>}
 *
 * @example
 * const output = await getWmicNetworkDrivesOutput()
 */
exports.getWmicNetworkDrivesOutput = async () => {
  // Exported for tests.
  // Windows's wmic outputs ucs2 encoded data.
  // When trying to read its stdout from node's execFile, it is always transformed (even if you pass { encoding: 'buffer' })
  // Information is lost and accented characters become unreadable (with no way to guess what they were).
  // Because of this, we use the wmic's "/output:" switch that redirects the output to a file.
  // For some reason wmic doesn't like dashes in filenames, that's why we change the tmp file prefix in tmpFileAsync above.
  return Bluebird.using(tmpFileDisposer(), async ({ path }) => {
    await execFileAsync(
      Path.join(process.env.SystemRoot, 'System32', 'Wbem', 'wmic'),
      [
        `/output:${path}`,
        'path',
        'Win32_LogicalDisk',
        'Where',
        'DriveType="4"',
        'get',
        'DeviceID,ProviderName'
      ],
      { windowsHide: true, windowsVerbatimArguments: true }
    )
    const data = await readFileAsync(path, 'ucs2')
    return data
  })
}

/**
 * @summary returns a Map of drive letter -> network locations on Windows
 * @function
 *
 * @returns {Promise<Map<String, String>>} - 'Z:' -> '\\\\192.168.0.1\\Public'
 *
 * @example
 * getWindowsNetworkDrives()
 *   .then(console.log);
 */
const getWindowsNetworkDrives = async () => {
  const result = await exports.getWmicNetworkDrivesOutput()
  const couples = _.chain(result)
    .split('\n')

    // Remove header line
    // eslint-disable-next-line no-magic-numbers
    .slice(1)

    // Remove extra spaces / tabs / carriage returns
    .invokeMap(String.prototype.trim)

    // Filter out empty lines
    .compact()
    .map((str) => {
      const colonPosition = str.indexOf(':')
      // eslint-disable-next-line no-magic-numbers
      if (colonPosition === -1) {
        throw new Error(`Can't parse wmic output: ${result}`)
      }
      // eslint-disable-next-line no-magic-numbers
      return [ str.slice(0, colonPosition + 1), _.trim(str.slice(colonPosition + 1)) ]
    })
    .value()
  return new Map(couples)
}

/**
 * @summary Replaces network drive letter with network drive location in the provided filePath on Windows
 * @function
 *
 * @param {String} filePath - file path
 *
 * @returns {String} - updated file path
 *
 * @example
 * replaceWindowsNetworkDriveLetter('Z:\\some-file')
 *   .then(console.log);
 */
exports.replaceWindowsNetworkDriveLetter = async (filePath) => {
  let result = filePath
  if (os.platform() === 'win32') {
    const matches = /^([A-Z]+:)\\(.*)$/.exec(filePath)
    if (matches !== null) {
      const [ , drive, relativePath ] = matches
      const drives = await getWindowsNetworkDrives()
      const location = drives.get(drive)
      // eslint-disable-next-line no-undefined
      if (location !== undefined) {
        result = `${location}\\${relativePath}`
      }
    }
  }
  return result
}
