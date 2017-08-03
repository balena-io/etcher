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

const chalk = require('chalk')
const errors = require('../shared/errors')

/**
 * @summary Print an error to stderr
 * @function
 * @public
 *
 * @param {Error} error - error
 *
 * @example
 * utils.printError(new Error('Oops!'));
 */
exports.printError = (error) => {
  const title = errors.getTitle(error)
  const description = errors.getDescription(error, {
    userFriendlyDescriptionsOnly: true
  })

  console.error(chalk.red(title))

  if (description) {
    console.error(`\n${chalk.red(description)}`)
  }

  if (process.env.ETCHER_CLI_DEBUG && error.stack) {
    console.error(`\n${chalk.red(error.stack)}`)
  }
}
