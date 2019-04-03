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

const cp = require('child_process')
const _ = require('lodash')
const os = require('os')
const path = require('path')
const process = require('process')

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
  const result = await execFileAsync(
    path.join(process.env.SystemRoot, 'System32', 'Wbem', 'wmic'),
    [ 'path', 'Win32_LogicalDisk', 'Where', 'DriveType="4"', 'get', 'DeviceID,ProviderName' ],
    { windowsHide: true, windowsVerbatimArguments: true }
  )
  const couples = _.chain(result.stdout)
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
        throw new Error(`Can't parse wmic output: ${result.stdout}`)
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
