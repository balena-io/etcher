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

/**
 * @module Etcher.Modules.ImageWriter
 */

const angular = require('angular')
const _ = require('lodash')
const childWriter = require('../../child-writer')
const settings = require('../models/settings')
const flashState = require('../../shared/models/flash-state')
const errors = require('../../shared/errors')
const windowProgress = require('../os/window-progress')
const analytics = require('../modules/analytics')

const MODULE_NAME = 'Etcher.Modules.ImageWriter'
const imageWriter = angular.module(MODULE_NAME, [])

imageWriter.service('ImageWriterService', function ($q, $rootScope) {
  /**
   * @summary Perform write operation
   * @function
   * @private
   *
   * @description
   * This function is extracted for testing purposes.
   *
   * @param {String} image - image path
   * @param {Object[]} drives - drives
   * @param {Function} onProgress - in progress callback (state)
   *
   * @fulfil {Object} - flash results
   * @returns {Promise}
   *
   * @example
   * ImageWriter.performWrite('path/to/image.img', {
   *   device: '/dev/disk2'
   * }, (state) => {
   *   console.log(state.percentage);
   * });
   */
  this.performWrite = (image, drives, onProgress) => {
    return $q((resolve, reject) => {
      const child = childWriter.write(image, drives, {
        validateWriteOnSuccess: settings.get('validateWriteOnSuccess'),
        unmountOnSuccess: settings.get('unmountOnSuccess')
      })
      child.on('error', reject)
      child.on('done', resolve)
      child.on('progress', onProgress)
    }).then((result) => {
      return result
    })
  }

  /**
   * @summary Flash an image to drives
   * @function
   * @public
   *
   * @description
   * This function will update `ImageWriterService.state` with the current writing state.
   *
   * @param {String} image - image path
   * @param {Object[]} drives - drives
   * @returns {Promise}
   *
   * @example
   * ImageWriterService.flash('foo.img', {
   *   device: '/dev/disk2'
   * }).then(() => {
   *   console.log('Write completed!');
   * });
   */
  this.flash = (image, drives) => {
    if (flashState.isFlashing()) {
      return $q.reject(new Error('There is already a flash in progress'))
    }

    flashState.setFlashingFlag()

    const analyticsData = {
      image,
      drives,
      uuid: flashState.getFlashUuid(),
      unmountOnSuccess: settings.get('unmountOnSuccess'),
      validateWriteOnSuccess: settings.get('validateWriteOnSuccess')
    }

    analytics.logEvent('Flash', analyticsData)

    const states = {}

    return this.performWrite(image, drives, (currentState) => {
      states[currentState.device] = currentState

      const slowestType = _.last(_.sortBy(_.map(_.values(states), 'type')))

      const applyToFields = (func, key) => {
        const fields = _.filter(_.values(states), [ 'type', slowestType ])
        return func(_.map(fields, key))
      }

      const averageState = {
        eta: applyToFields(_.max, 'eta'),
        percentage: applyToFields(_.min, 'percentage'),
        speed: applyToFields(_.min, 'speed'),

        // Use the 'slowest' type, i.e. 'write', if it exists
        type: slowestType
      }

      // Bring this value to the world of angular.
      // If we don't trigger a digest loop,
      // `.getFlashState()` will not return
      // the latest updated progress state.
      $rootScope.$apply(() => {
        flashState.setProgressState(averageState)
      })
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

      return $q.reject(error)
    }).finally(() => {
      windowProgress.clear()
    })
  }
})

module.exports = MODULE_NAME
