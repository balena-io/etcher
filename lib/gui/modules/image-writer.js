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
const path = require('path')
const os = require('os')
const ipc = require('node-ipc')
const isRunningInAsar = require('electron-is-running-in-asar')
const electron = require('electron')
const settings = require('../models/settings')
const flashState = require('../../shared/models/flash-state')
const errors = require('../../shared/errors')
const permissions = require('../../shared/permissions')
const windowProgress = require('../os/window-progress')
const analytics = require('../modules/analytics')
const packageJSON = require('../../../package.json')

/**
 * @summary Get application entry point
 * @function
 * @private
 *
 * @returns {String} entry point
 *
 * @example
 * const entryPoint = imageWriter.getApplicationEntryPoint()
 */
const getApplicationEntryPoint = () => {
  if (isRunningInAsar()) {
    return path.join(process.resourcesPath, 'app.asar')
  }

  const ENTRY_POINT_ARGV_INDEX = 1
  const relativeEntryPoint = electron.remote.process.argv[ENTRY_POINT_ARGV_INDEX]

  const PROJECT_ROOT = path.join(__dirname, '..', '..', '..')
  return path.join(PROJECT_ROOT, relativeEntryPoint)
}

/**
 * @summary Perform write operation
 * @function
 * @private
 *
 * @description
 * This function is extracted for testing purposes.
 *
 * @param {String} image - image path
 * @param {Object} drive - drive
 * @param {Function} onProgress - in progress callback (state)
 *
 * @fulfil {Object} - flash results
 * @returns {Promise}
 *
 * @example
 * imageWriter.performWrite('path/to/image.img', {
 *   device: '/dev/disk2'
 * }, (state) => {
 *   console.log(state.percentage)
 * })
 */
exports.performWrite = (image, drive, onProgress) => {
  // There might be multiple Etcher instances running at
  // the same time, therefore we must ensure each IPC
  // server/client has a different name.
  const IPC_SERVER_ID = `etcher-server-${process.pid}`
  const IPC_CLIENT_ID = `etcher-client-${process.pid}`

  ipc.config.id = IPC_SERVER_ID
  ipc.config.socketRoot = path.join(process.env.XDG_RUNTIME_DIR || os.tmpdir(), path.sep)

  // NOTE: Ensure this isn't disabled, as it will cause
  // the stdout maxBuffer size to be exceeded when flashing
  ipc.config.silent = true
  ipc.serve()

  /**
   * @summary Safely terminate the IPC server
   * @function
   * @private
   *
   * @example
   * terminateServer()
   */
  const terminateServer = () => {
    // Turns out we need to destroy all sockets for
    // the server to actually close. Otherwise, it
    // just stops receiving any further connections,
    // but remains open if there are active ones.
    _.each(ipc.server.sockets, (socket) => {
      socket.destroy()
    })

    ipc.server.stop()
  }

  return new Bluebird((resolve, reject) => {
    ipc.server.on('error', (error) => {
      terminateServer()
      const errorObject = _.isError(error) ? error : errors.fromJSON(error)
      reject(errorObject)
    })

    ipc.server.on('log', (message) => {
      console.log(message)
    })

    const flashResults = {}
    ipc.server.on('done', (results) => {
      _.merge(flashResults, results)
    })

    ipc.server.on('state', onProgress)

    const argv = _.attempt(() => {
      const entryPoint = getApplicationEntryPoint()

      // AppImages run over FUSE, so the files inside the mount point
      // can only be accessed by the user that mounted the AppImage.
      // This means we can't re-spawn Etcher as root from the same
      // mount-point, and as a workaround, we re-mount the original
      // AppImage as root.
      if (os.platform() === 'linux' && process.env.APPIMAGE && process.env.APPDIR) {
        return [
          process.env.APPIMAGE,

          // Executing the AppImage with ELECTRON_RUN_AS_NODE opens
          // the Node.js REPL without loading the default entry point.
          // As a workaround, we can pass the path to the file we want
          // to load, relative to the usr/ directory of the mounted
          // AppImage.
          _.replace(entryPoint, path.join(process.env.APPDIR, 'usr/'), '')
        ]
      }

      return [
        _.first(process.argv),
        entryPoint
      ]
    })

    ipc.server.on('start', () => {
      console.log(`Elevating command: ${_.join(argv, ' ')}`)

      permissions.elevateCommand(argv, {
        applicationName: packageJSON.displayName,
        environment: {
          IPC_SERVER_ID,
          IPC_CLIENT_ID,
          IPC_SOCKET_ROOT: ipc.config.socketRoot,
          ELECTRON_RUN_AS_NODE: 1,

          // Casting to Number nicely converts booleans to 0 or 1.
          OPTION_VALIDATE: Number(settings.get('validateWriteOnSuccess')),
          OPTION_UNMOUNT: Number(settings.get('unmountOnSuccess')),

          OPTION_IMAGE: image,
          OPTION_DEVICE: drive.device,

          // This environment variable prevents the AppImages
          // desktop integration script from presenting the
          // "installation" dialog
          SKIP: 1
        }
      }).then((results) => {
        flashResults.cancelled = results.cancelled
        console.log('Flash results', flashResults)

        // This likely means the child died halfway through
        if (!flashResults.cancelled && !flashResults.bytesWritten) {
          throw errors.createUserError({
            title: 'The writer process ended unexpectedly',
            description: 'Please try again, and contact the Etcher team if the problem persists',
            code: 'ECHILDDIED'
          })
        }

        return resolve(flashResults)
      }).catch((error) => {
        // This happens when the child is killed using SIGKILL
        const SIGKILL_EXIT_CODE = 137
        if (error.code === SIGKILL_EXIT_CODE) {
          error.code = 'ECHILDDIED'
        }

        return reject(error)
      }).finally(() => {
        console.log('Terminating IPC server')
        terminateServer()
      })
    })

    ipc.server.start()
  })
}

/**
 * @summary Flash an image to a drive
 * @function
 * @public
 *
 * @description
 * This function will update `imageWriter.state` with the current writing state.
 *
 * @param {String} image - image path
 * @param {Object} drive - drive
 * @returns {Promise}
 *
 * @example
 * imageWriter.flash('foo.img', {
 *   device: '/dev/disk2'
 * }).then(() => {
 *   console.log('Write completed!')
 * })
 */
exports.flash = (image, drive) => {
  if (flashState.isFlashing()) {
    return Bluebird.reject(new Error('There is already a flash in progress'))
  }

  flashState.setFlashingFlag()

  const analyticsData = {
    image,
    drive,
    uuid: flashState.getFlashUuid(),
    unmountOnSuccess: settings.get('unmountOnSuccess'),
    validateWriteOnSuccess: settings.get('validateWriteOnSuccess')
  }

  analytics.logEvent('Flash', analyticsData)

  return exports.performWrite(image, drive, (state) => {
    flashState.setProgressState(state)
  }).then(flashState.unsetFlashingFlag).then(() => {
    if (flashState.wasLastFlashCancelled()) {
      analytics.logEvent('Elevation cancelled', analyticsData)
    } else {
      analytics.logEvent('Done', analyticsData)
    }
  }).catch((error) => {
    flashState.unsetFlashingFlag({
      errorCode: error.code
    })

    if (error.code === 'EVALIDATION') {
      analytics.logEvent('Validation error', analyticsData)
    } else if (error.code === 'EUNPLUGGED') {
      analytics.logEvent('Drive unplugged', analyticsData)
    } else if (error.code === 'EIO') {
      analytics.logEvent('Input/output error', analyticsData)
    } else if (error.code === 'ENOSPC') {
      analytics.logEvent('Out of space', analyticsData)
    } else if (error.code === 'ECHILDDIED') {
      analytics.logEvent('Child died unexpectedly', analyticsData)
    } else {
      analytics.logEvent('Flash error', _.merge({
        error: errors.toJSON(error)
      }, analyticsData))
    }

    return Bluebird.reject(error)
  }).finally(() => {
    windowProgress.clear()
  })
}
