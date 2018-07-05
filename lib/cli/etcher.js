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

const _ = require('lodash')
const Bluebird = require('bluebird')
const visuals = require('resin-cli-visuals')
const form = require('resin-cli-form')
const bytes = require('pretty-bytes')
const sdk = require('etcher-sdk')

const utils = require('./utils')
const options = require('./options')
const messages = require('../shared/messages')
const EXIT_CODES = require('../shared/exit-codes')
const errors = require('../shared/errors')
const permissions = require('../shared/permissions')

/* eslint-disable no-magic-numbers */

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

  const progressBars = new Map()
  let lastStateType = null

  // eslint-disable-next-line require-jsdoc
  const onProgress = (state) => {
    state.message = state.active > 1
      ? `${bytes(state.totalSpeed)}/s total, ${bytes(state.speed)}/s x ${state.active}`
      : `${bytes(state.totalSpeed)}/s`

    state.message = `${state.type === 'flashing' ? 'Flashing' : 'Validating'}: ${state.message}`

    // eslint-disable-next-line no-undefined
    if (state.percentage === undefined) {
      state.message += ` - ${bytes(state.bytes)} written`
    }

    // Update progress bar
    let progressBar = progressBars.get(state.type)
    // eslint-disable-next-line no-undefined
    if (progressBar === undefined) {
      // Stop the spinner if there is one
      if ((lastStateType !== null) && (lastStateType !== state.type)) {
        const spinner = progressBars.get(lastStateType)
        // eslint-disable-next-line no-undefined
        if ((spinner !== undefined) && (spinner instanceof visuals.Spinner)) {
          console.log()
          spinner.stop()
        }
      }
      // eslint-disable-next-line no-undefined
      if (state.percentage === undefined) {
        progressBar = new visuals.Spinner(state.message)
        progressBar.start()
      } else {
        progressBar = new visuals.Progress(state.message)
        progressBar.update(state)
      }
      progressBars.set(state.type, progressBar)
    } else if (progressBar instanceof visuals.Spinner) {
      progressBar.spinner.setSpinnerTitle(state.message)
    } else {
      progressBar.update(state)
    }
    lastStateType = state.type
  }

  const adapter = new sdk.scanner.adapters.BlockDeviceAdapter(() => {
    return options.unmount
  })
  const scanner = new sdk.scanner.Scanner([ adapter ])
  return new Promise((resolve, reject) => {
    scanner.on('ready', resolve)
    scanner.on('error', reject)
    scanner.start()
  })
    .then(() => {
      return (new sdk.sourceDestination.File(imagePath, sdk.sourceDestination.File.OpenFlags.Read)).getInnerSource()
    })
    .then((innerSource) => {
      // NOTE: Drive can be (String|Array)
      const destinations = _.map([].concat(answers.drive), (device) => {
        const drive = scanner.getBy('device', device)
        if (!drive) {
          throw new Error(`No such drive ${device}`)
        }
        return drive
      })
      return sdk.multiWrite.pipeSourceToDestinations(
        innerSource,
        destinations,
        (destination, error) => {
          console.log(`Error "${error}" on ${destination.drive}`)
        },
        onProgress,
        options.check
      )
    })
}).then(({ failures, bytesWritten }) => {
  let exitCode = EXIT_CODES.SUCCESS

  if (failures.size > 0) {
    exitCode = EXIT_CODES.GENERAL_ERROR
    console.log('')

    for (const [ destination, error ] of failures) {
      console.log(`  - ${destination.drive}: ${error.message}`)
    }
  }

  process.exit(exitCode)
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
