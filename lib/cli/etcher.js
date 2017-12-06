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

const path = require('path')
const Bluebird = require('bluebird')
const visuals = require('resin-cli-visuals')
const form = require('resin-cli-form')
const writer = require('./writer')
const utils = require('./utils')
const options = require('./options')
const messages = require('../shared/messages')
const EXIT_CODES = require('../shared/exit-codes')
const errors = require('../shared/errors')
const permissions = require('../shared/permissions')

const ARGV_IMAGE_PATH_INDEX = 0
const imagePath = options._[ARGV_IMAGE_PATH_INDEX]

permissions.isElevated().then((elevated) => {
  if (!elevated) {
    throw errors.createUserError({
      title: messages.error.elevationRequired(),
      description: 'This tool requires special permissions to write to external drives'
    })
  }

  return form.run([
    {
      message: 'Select drive',
      type: 'drive',
      name: 'drive'
    },
    {
      message: 'This will erase the selected drive. Are you sure?',
      type: 'confirm',
      name: 'yes',
      default: false
    }
  ], {
    override: {
      drive: options.drive,

      // If `options.yes` is `false`, pass `null`,
      // otherwise the question will not be asked because
      // `false` is a defined value.
      yes: options.yes || null

    }
  })
}).then((answers) => {
  if (!answers.yes) {
    throw errors.createUserError({
      title: 'Aborted',
      description: 'We can\'t proceed without confirmation'
    })
  }

  const progressBars = {
    write: new visuals.Progress('Flashing'),
    check: new visuals.Progress('Validating')
  }

  return writer.writeImage(imagePath, answers.drive, {
    unmountOnSuccess: options.unmount,
    validateWriteOnSuccess: options.check
  }, (state) => {
    progressBars[state.type].update(state)
  }).then((results) => {
    return {
      imagePath,
      flash: results
    }
  })
}).then((results) => {
  return Bluebird.try(() => {
    console.log(messages.info.flashComplete({
      drive: results.flash.drive,
      imageBasename: path.basename(results.imagePath)
    }))

    if (results.flash.checksum.crc32) {
      console.log(`Checksum: ${results.flash.checksum.crc32}`)
    }

    return Bluebird.resolve()
  }).then(() => {
    process.exit(EXIT_CODES.SUCCESS)
  })
}).catch((error) => {
  return Bluebird.try(() => {
    utils.printError(error)
    return Bluebird.resolve()
  }).then(() => {
    if (error.code === 'EVALIDATION') {
      process.exit(EXIT_CODES.VALIDATION_ERROR)
    }

    process.exit(EXIT_CODES.GENERAL_ERROR)
  })
})
