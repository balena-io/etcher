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

const electron = require('electron')
const EventEmitter = require('events')
const createInactivityTimer = require('inactivity-timer')
const debug = require('debug')('etcher:update-lock')
const analytics = require('./analytics')
const settings = require('../models/settings')

/* eslint-disable no-magic-numbers, callback-return */

/**
 * Interaction timeout in milliseconds (defaults to 5 minutes)
 * @type {Number}
 * @constant
 */
const INTERACTION_TIMEOUT_MS = settings.has('interactionTimeout')
  ? parseInt(settings.get('interactionTimeout'), 10)
  : 5 * 60 * 1000

/**
 * Balena Update Lock
 * @class
 */
class UpdateLock extends EventEmitter {
  /**
   * @summary Balena Update Lock
   * @example
   * new UpdateLock()
   */
  constructor () {
    super()
    this.paused = false
    this.on('inactive', UpdateLock.onInactive)
    this.lockTimer = createInactivityTimer(INTERACTION_TIMEOUT_MS, () => {
      debug('inactive')
      this.emit('inactive')
    })
  }

  /**
   * @summary Inactivity event handler, releases the balena update lock on inactivity
   * @private
   * @example
   * this.on('inactive', onInactive)
   */
  static onInactive () {
    if (settings.get('resinUpdateLock')) {
      UpdateLock.check((checkError, isLocked) => {
        debug('inactive-check', Boolean(checkError))
        if (checkError) {
          analytics.logException(checkError)
        }
        if (isLocked) {
          UpdateLock.release((error) => {
            debug('inactive-release', Boolean(error))
            if (error) {
              analytics.logException(error)
            }
          })
        }
      })
    }
  }

  /**
   * @summary Acquire the update lock
   * @private
   * @param {Function} callback - callback(error)
   * @example
   * UpdateLock.acquire((error) => {
   *   // ...
   * })
   */
  static acquire (callback) {
    debug('lock')
    if (settings.get('resinUpdateLock')) {
      electron.ipcRenderer.once('resin-update-lock', (event, error) => {
        callback(error)
      })
      electron.ipcRenderer.send('resin-update-lock', 'lock')
    } else {
      callback(new Error('Update lock disabled'))
    }
  }

  /**
   * @summary Release the update lock
   * @private
   * @param {Function} callback - callback(error)
   * @example
   * UpdateLock.release((error) => {
   *   // ...
   * })
   */
  static release (callback) {
    debug('unlock')
    if (settings.get('resinUpdateLock')) {
      electron.ipcRenderer.once('resin-update-lock', (event, error) => {
        callback(error)
      })
      electron.ipcRenderer.send('resin-update-lock', 'unlock')
    } else {
      callback(new Error('Update lock disabled'))
    }
  }

  /**
   * @summary Check the state of the update lock
   * @private
   * @param {Function} callback - callback(error, isLocked)
   * @example
   * UpdateLock.check((error, isLocked) => {
   *   if (isLocked) {
   *     // ...
   *   }
   * })
   */
  static check (callback) {
    debug('check')
    if (settings.get('resinUpdateLock')) {
      electron.ipcRenderer.once('resin-update-lock', (event, error, isLocked) => {
        callback(error, isLocked)
      })
      electron.ipcRenderer.send('resin-update-lock', 'check')
    } else {
      callback(new Error('Update lock disabled'))
    }
  }

  /**
   * @summary Extend the lock timer
   * @example
   * updateLock.extend()
   */
  extend () {
    debug('extend')

    if (this.paused) {
      debug('extend:paused')
      return
    }

    this.lockTimer.signal()

    // When extending, check that we have the lock,
    // and acquire it, if not
    if (settings.get('resinUpdateLock')) {
      UpdateLock.check((checkError, isLocked) => {
        if (checkError) {
          analytics.logException(checkError)
        }
        if (!isLocked) {
          UpdateLock.acquire((error) => {
            if (error) {
              analytics.logException(error)
            }
            debug('extend-acquire', Boolean(error))
          })
        }
      })
    }
  }

  /**
   * @summary Clear the lock timer
   * @example
   * updateLock.clearTimer()
   */
  clearTimer () {
    debug('clear')
    this.lockTimer.clear()
  }

  /**
   * @summary Clear the lock timer, and pause extension, avoiding triggering until resume()d
   * @example
   * updateLock.pause()
   */
  pause () {
    debug('pause')
    this.paused = true
    this.clearTimer()
  }

  /**
   * @summary Un-pause lock extension, and restart the timer
   * @example
   * updateLock.resume()
   */
  resume () {
    debug('resume')
    this.paused = false
    this.extend()
  }
}

module.exports = new UpdateLock()
