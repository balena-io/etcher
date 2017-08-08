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
const childWriter = require('../../child-writer')
const settings = require('../models/settings')
const flashState = require('../../shared/models/flash-state')
const errors = require('../../shared/errors')
const windowProgress = require('../os/window-progress')
const analytics = require('../modules/analytics')

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
  return new Bluebird((resolve, reject) => {
    const child = childWriter.write(image, drive, {
      validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
      unmountOnSuccess: settings.get('unmountOnSuccess')
    })
    child.on('error', reject)
    child.on('done', resolve)
    child.on('progress', onProgress)
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
