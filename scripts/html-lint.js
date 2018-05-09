/**
 * This script setups and runs linting modules on our HTML files.
 *
 * See https://github.com/nikestep/html-angular-validate
 *
 * Usage:
 *
 *   node scripts/html-lint.js
 */

'use strict'

const chalk = require('chalk')
const path = require('path')
const _ = require('lodash')
const angularValidate = require('html-angular-validate')
const EXIT_CODES = require('../lib/shared/exit-codes')
const PROJECT_ROOT = path.join(__dirname, '..')
const FILENAME = path.relative(PROJECT_ROOT, __filename)

console.log('Scanning...')

angularValidate.validate(
  [
    path.join(PROJECT_ROOT, 'lib', 'gui', '**/*.html')
  ],
  {
    customattrs: [

      // Internal
      'os-open-external',
      'os-dropzone',
      'manifest-bind',

      // External
      'hide-if-state',
      'show-if-state',
      'uib-tooltip',
      'tooltip-placement'

    ],
    angular: true,
    tmplext: 'tpl.html',
    doctype: 'HTML5',
    charset: 'utf-8',
    reportpath: null,
    reportCheckstylePath: null,
    relaxerror: [
      'Expected a minus sign or a digit',
      'Consider adding a “lang” attribute to the “html” start tag to declare the language of this document.',
      'Element “wifi” not allowed as child of element “body” in this context'
    ]
  }
).then((result) => {
  _.each(result.failed, (failure) => {
    // The module has a typo in the "numbers" property
    console.error(chalk.red(`${failure.numerrs} errors at ${path.relative(PROJECT_ROOT, failure.filepath)}`))

    _.each(failure.errors, (error) => {
      const errorPosition = `[${error.line}:${error.col}]`
      console.error(`  ${chalk.yellow(errorPosition)} ${error.msg}`)

      if (/^Attribute (.*) not allowed on/.test(error.msg)) {
        console.error(chalk.dim(`    If this is a valid directive attribute, add it to the whitelist at ${FILENAME}`))
      }
    })

    console.error('')
  })

  if (result.filessucceeded === result.fileschecked) {
    console.log(chalk.green('Passed'))
  } else {
    console.error(chalk.red(`Total: ${result.filessucceeded}/${result.fileschecked}`))
  }

  if (!result.allpassed) {
    const EXIT_TIMEOUT_MS = 500

    // Add a small timeout, otherwise the scripts exits
    // before every string was printed on the screen.
    setTimeout(() => {
      process.exit(EXIT_CODES.GENERAL_ERROR)
    }, EXIT_TIMEOUT_MS)
  }
}, (error) => {
  console.error(error)
  process.exit(EXIT_CODES.GENERAL_ERROR)
})
