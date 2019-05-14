/**
 * This script is in charge of cleaning the `shrinkwrap` file.
 *
 * `npm shrinkwrap` has a bug where it will add optional dependencies
 * to `npm-shrinkwrap.json`, therefore causing errors if these optional
 * dependendencies are platform dependent and you then try to build
 * the project in another platform.
 *
 * As a workaround, we keep a list of platform dependent dependencies in
 * the `platformSpecificDependencies` property of `package.json`,
 * and manually remove them from `npm-shrinkwrap.json` if they exist.
 *
 * See: https://github.com/npm/npm/issues/2679
 */

'use strict'

const fs = require('fs')
const path = require('path')
const omit = require('omit-deep-lodash')

const JSON_INDENT = 2
const SHRINKWRAP_FILENAME = path.join(__dirname, '..', 'npm-shrinkwrap.json')

const packageInfo = require('../package.json')
const shrinkwrap = require('../npm-shrinkwrap.json')

const cleaned = omit(shrinkwrap, packageInfo.platformSpecificDependencies)

fs.writeFile(SHRINKWRAP_FILENAME, JSON.stringify(cleaned, null, JSON_INDENT), (error) => {
  if (error) {
    console.log(`[ERROR] Couldn't write shrinkwrap file: ${error.stack}`)
    process.exitCode = 1
  } else {
    console.log(`[OK] Wrote shrinkwrap file to ${path.relative(__dirname, SHRINKWRAP_FILENAME)}`)
  }
})
