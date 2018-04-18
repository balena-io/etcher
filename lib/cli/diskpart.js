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

'use strict'

const os = require('os')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const childProcess = require('child_process')
const debug = require('debug')('etcher:cli:diskpart')
const Promise = require('bluebird')
const retry = require('bluebird-retry')

const TMP_RANDOM_BYTES = 6
const DISKPART_DELAY = 2000
const DISKPART_RETRIES = 5

/**
 * @summary Generate a tmp filename with full path of OS' tmp dir
 * @function
 * @private
 *
 * @param {String} extension - temporary file extension
 * @returns {String} filename
 *
 * @example
 * const filename = tmpFilename('.sh');
 */
const tmpFilename = (extension) => {
  const random = crypto.randomBytes(TMP_RANDOM_BYTES).toString('hex')
  const filename = `etcher-diskpart-${random}${extension}`
  return path.join(os.tmpdir(), filename)
}

/**
 * @summary Run a diskpart script
 * @param {Array<String>} commands - list of commands to run
 * @param {Function} callback - callback(error)
 * @example
 * runDiskpart(['rescan'], (error) => {
 *   ...
 * })
 */
const runDiskpart = (commands, callback) => {
  if (os.platform() !== 'win32') {
    callback()
    return
  }

  const filename = tmpFilename('')
  const script = commands.join('\r\n')

  fs.writeFile(filename, script, {
    mode: 0o755
  }, (writeError) => {
    debug('write %s:', filename, writeError || 'OK')

    childProcess.exec(`diskpart /s ${filename}`, (execError, stdout, stderr) => {
      debug('stdout:', stdout)
      debug('stderr:', stderr)

      fs.unlink(filename, (unlinkError) => {
        debug('unlink %s:', filename, unlinkError || 'OK')
        callback(execError)
      })
    })
  })
}

module.exports = {

  /**
   * @summary Clean a device's partition tables
   * @param {String} device - device path
   * @example
   * diskpart.clean('\\\\.\\PhysicalDrive2')
   *   .then(...)
   *   .catch(...)
   * @returns {Promise}
   */
  clean (device) {
    if (os.platform() !== 'win32') {
      return Promise.resolve()
    }

    debug('clean', device)

    const pattern = /PHYSICALDRIVE(\d+)/i

    if (pattern.test(device)) {
      const deviceId = device.match(pattern).pop()
      return retry(() => {
        return new Promise((resolve, reject) => {
          runDiskpart([ `select disk ${deviceId}`, 'clean', 'rescan' ], (error) => {
            return error ? reject(error) : resolve()
          })
        }).delay(DISKPART_DELAY)
      }, {
        /* eslint-disable camelcase */
        max_tries: DISKPART_RETRIES
        /* eslint-enable camelcase */
      }).catch((error) => {
        throw new Error(`Couldn't clean the drive, ${error.failure.message} (code ${error.failure.code})`)
      })
    }

    return Promise.reject(new Error(`Invalid device: "${device}"`))
  }

}
