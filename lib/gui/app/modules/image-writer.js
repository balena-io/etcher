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
const store = require('../models/store')
const settings = require('../models/settings')
const flashState = require('../models/flash-state')
const errors = require('../../../shared/errors')
const permissions = require('../../../shared/permissions')
const windowProgress = require('../os/window-progress')
const analytics = require('../modules/analytics')
const updateLock = require('./update-lock')
const packageJSON = require('../../../../package.json')
const selectionState = require('../models/selection-state')

/**
 * @summary Number of threads per CPU to allocate to the UV_THREADPOOL
 * @type {Number}
 * @constant
 */
const THREADS_PER_CPU = 16

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

  const PROJECT_ROOT = path.join(__dirname, '..', '..', '..', '..')
  return path.resolve(PROJECT_ROOT, relativeEntryPoint)
}

/**
 * @summary Handle a flash  error and log it to analytics
 * @function
 * @private
 *
 * @param {Error} error - error object
 * @param {Object} analyticsData - analytics object
 *
 * @example
 * handleErrorLogging({ code: 'EUNPLUGGED' }, { image: 'resin.img' })
 */
const handleErrorLogging = (error, analyticsData) => {
  const eventData = _.assign({
    applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
    flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
    flashInstanceUuid: flashState.getFlashUuid()
  }, analyticsData)

  if (error.code === 'EVALIDATION') {
    analytics.logEvent('Validation error', eventData)
  } else if (error.code === 'EUNPLUGGED') {
    analytics.logEvent('Drive unplugged', eventData)
  } else if (error.code === 'EIO') {
    analytics.logEvent('Input/output error', eventData)
  } else if (error.code === 'ENOSPC') {
    analytics.logEvent('Out of space', eventData)
  } else if (error.code === 'ECHILDDIED') {
    analytics.logEvent('Child died unexpectedly', eventData)
  } else {
    analytics.logEvent('Flash error', _.merge({
      error: errors.toJSON(error)
    }, eventData))
  }
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
 * @param {Array<String>} drives - drives
 * @param {Function} onProgress - in progress callback (state)
 *
 * @fulfil {Object} - flash results
 * @returns {Promise}
 *
 * @example
 * imageWriter.performWrite('path/to/image.img', [ '/dev/disk2' ], (state) => {
 *   console.log(state.percentage)
 * })
 */
exports.performWrite = (image, drives, onProgress) => {
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
      const errorObject = errors.fromJSON(error)
      reject(errorObject)
    })

    ipc.server.on('log', (message) => {
      console.log(message)
    })

    const flashResults = {}
    const analyticsData = {
      image,
      drives,
      driveCount: drives.length,
      uuid: flashState.getFlashUuid(),
      flashInstanceUuid: flashState.getFlashUuid(),
      unmountOnSuccess: settings.get('unmountOnSuccess'),
      validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
      trim: settings.get('trim')
    }

    ipc.server.on('fail', ({ device, error }) => {
      handleErrorLogging(error, analyticsData)
    })

    ipc.server.on('done', (event) => {
      event.results.errors = _.map(event.results.errors, (data) => {
        return errors.fromJSON(data)
      })
      _.merge(flashResults, event)
    })

    ipc.server.on('abort', () => {
      terminateServer()
      resolve({
        cancelled: true
      })
    })

    ipc.server.on('state', onProgress)

    ipc.server.on('ready', (data, socket) => {
      ipc.server.emit(socket, 'write', {
        imagePath: image,
        destinations: drives,
        validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
        trim: settings.get('trim'),
        unmountOnSuccess: settings.get('unmountOnSuccess')
      })
    })

    const argv = _.attempt(() => {
      let entryPoint = getApplicationEntryPoint()

      // AppImages run over FUSE, so the files inside the mount point
      // can only be accessed by the user that mounted the AppImage.
      // This means we can't re-spawn Etcher as root from the same
      // mount-point, and as a workaround, we re-mount the original
      // AppImage as root.
      if (os.platform() === 'linux' && process.env.APPIMAGE && process.env.APPDIR) {
        entryPoint = _.replace(entryPoint, process.env.APPDIR, '')
        return [
          process.env.APPIMAGE,
          '-e',
          `require(\`\${process.env.APPDIR}${entryPoint}\`)`
        ]
      }
      return [
        _.first(process.argv),
        entryPoint
      ]
    })

    ipc.server.on('start', () => {
      console.log(`Elevating command: ${_.join(argv, ' ')}`)

      const env = _.assign({}, process.platform === 'win32' ? {} : process.env, {
        IPC_SERVER_ID,
        IPC_CLIENT_ID,
        IPC_SOCKET_ROOT: ipc.config.socketRoot,
        ELECTRON_RUN_AS_NODE: 1,
        UV_THREADPOOL_SIZE: os.cpus().length * THREADS_PER_CPU,

        // This environment variable prevents the AppImages
        // desktop integration script from presenting the
        // "installation" dialog
        SKIP: 1
      })

      permissions.elevateCommand(argv, {
        applicationName: packageJSON.displayName,
        environment: env
      }).then((results) => {
        flashResults.cancelled = results.cancelled
        console.log('Flash results', flashResults)

        // This likely means the child died halfway through
        if (!flashResults.cancelled && !_.get(flashResults, [ 'results', 'bytesWritten' ])) {
          throw errors.createUserError({
            title: 'The writer process ended unexpectedly',
            description: 'Please try again, and contact the Etcher team if the problem persists',
            code: 'ECHILDDIED'
          })
        }

        resolve(flashResults)
      }).catch((error) => {
        // This happens when the child is killed using SIGKILL
        const SIGKILL_EXIT_CODE = 137
        if (error.code === SIGKILL_EXIT_CODE) {
          error.code = 'ECHILDDIED'
        }
        reject(error)
      }).finally(() => {
        console.log('Terminating IPC server')
        terminateServer()
      })
    })

    // Clear the update lock timer to prevent longer
    // flashing timing it out, and releasing the lock
    updateLock.pause()
    ipc.server.start()
  })
}

/**
 * @summary Flash an image to drives
 * @function
 * @public
 *
 * @description
 * This function will update `imageWriter.state` with the current writing state.
 *
 * @param {String} image - image path
 * @param {Array<String>} drives - drives
 * @returns {Promise}
 *
 * @example
 * imageWriter.flash('foo.img', [ '/dev/disk2' ]).then(() => {
 *   console.log('Write completed!')
 * })
 */
exports.flash = (image, drives) => {
  if (flashState.isFlashing()) {
    return Bluebird.reject(new Error('There is already a flash in progress'))
  }

  flashState.setFlashingFlag()

  const analyticsData = {
    image,
    drives,
    driveCount: drives.length,
    uuid: flashState.getFlashUuid(),
    status: 'started',
    flashInstanceUuid: flashState.getFlashUuid(),
    unmountOnSuccess: settings.get('unmountOnSuccess'),
    validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
    trim: settings.get('trim'),
    applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
    flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
  }

  analytics.logEvent('Flash', analyticsData)

  return exports.performWrite(image, drives, (state) => {
    flashState.setProgressState(state)
  }).then(flashState.unsetFlashingFlag).then(() => {
    if (flashState.wasLastFlashCancelled()) {
      const eventData = _.assign({ status: 'cancel' }, analyticsData)
      analytics.logEvent('Elevation cancelled', eventData)
    } else {
      const { results } = flashState.getFlashResults()
      const eventData = _.assign({
        errors: results.errors,
        devices: results.devices,
        status: 'finished'
      },
      analyticsData)
      analytics.logEvent('Done', eventData)
    }
  }).catch((error) => {
    flashState.unsetFlashingFlag({
      errorCode: error.code
    })

    // eslint-disable-next-line no-magic-numbers
    if (drives.length > 1) {
      const { results } = flashState.getFlashResults()
      const eventData = _.assign({
        errors: results.errors,
        devices: results.devices,
        status: 'failed'
      },
      analyticsData)
      analytics.logEvent('Write failed', eventData)
    }

    return Bluebird.reject(error)
  }).finally(() => {
    windowProgress.clear()
  })
}

/**
 * @summary Cancel write operation
 * @function
 * @public
 *
 * @example
 * imageWriter.cancel()
 */
exports.cancel = () => {
  const drives = selectionState.getSelectedDevices()
  const analyticsData = {
    image: selectionState.getImagePath(),
    drives,
    driveCount: drives.length,
    uuid: flashState.getFlashUuid(),
    flashInstanceUuid: flashState.getFlashUuid(),
    unmountOnSuccess: settings.get('unmountOnSuccess'),
    validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
    trim: settings.get('trim'),
    applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
    flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
    status: 'cancel'
  }
  analytics.logEvent('Cancel', analyticsData)

  // Re-enable lock release on inactivity
  updateLock.resume()

  try {
    const [ socket ] = ipc.server.sockets
    // eslint-disable-next-line no-undefined
    if (socket !== undefined) {
      ipc.server.emit(socket, 'cancel')
    }
  } catch (error) {
    analytics.logException(error)
  }
}
