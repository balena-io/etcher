/**
 * This script is in charge of generating the `shrinkwrap` file.
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

/* eslint-disable lodash/prefer-lodash-method */
/* eslint-disable no-magic-numbers */
/* eslint-disable no-undefined */

'use strict'

const fs = require('fs')
const path = require('path')

const JSON_INDENT = 2
const SHRINKWRAP_FILENAME = path.join(__dirname, '..', 'npm-shrinkwrap.json')

const packageInfo = require('../package.json')
const shrinkwrap = require('../npm-shrinkwrap.json')

/**
 * @summary Traverse a shrinkwrap tree and call
 * a given function on each dependency
 * @param {Object} tree - shrinkwrap
 * @param {Function} onNode - callback({Object} parent, {String} parentName, {String} name, {Object} info)
 * @param {String} [parentName] - name of dependent (used internally)
 * @example
 * traverseDeps(shrinkwrap, (parent, parentName, name, info) => {
 *   // ...
 * })
 */
const traverseDeps = (tree, onNode, parentName) => {
  if (!tree.dependencies) {
    return
  }

  const keys = Object.keys(tree.dependencies)

  let name = null

  for (let index = 0; index < keys.length; index += 1) {
    name = keys[index]

    // Check for this depedency to still exist,
    // as a node might have been removed just before this iteration
    if (tree.dependencies[name]) {
      onNode(tree, parentName || tree.name, name, tree.dependencies[name])

      // Check that the walking function didn't remove the dependency;
      // if so, skip it and continue with the next one
      if (tree.dependencies[name] && tree.dependencies[name].dependencies) {
        traverseDeps(tree.dependencies[name], onNode, name)
      }
    }
  }
}

console.log('Cleaning shrinkwrap...')

// Walk the generated shrinkwrap tree & apply modifications if necessary
traverseDeps(shrinkwrap, (parent, parentName, name, info) => {
  // If this dependency depends on a "blacklisted" optional
  // dependency; remove it from the shrinkwrap
  if (packageInfo.platformSpecificDependencies.includes(name)) {
    console.log(' - Removing "%s" from "%s"', name, parentName)
    parent.dependencies[name] = undefined
    Reflect.deleteProperty(parent.dependencies, name)
    return
  }

  // Delete `from` fields to avoid different diffs
  // on different platforms
  info.from = undefined
  Reflect.deleteProperty(info, 'from')
})

// Generate the new shrinkwrap JSON
const shrinkwrapJson = JSON.stringify(shrinkwrap, null, JSON_INDENT)

// Write back the modified npm-shrinkwrap.json
fs.writeFile(SHRINKWRAP_FILENAME, shrinkwrapJson, (error) => {
  if (error) {
    console.log(`[ERROR] Couldn't write shrinkwrap file: ${error.stack}`)
    process.exit(1)
  } else {
    console.log(`[OK] Wrote shrinkwrap file to ${path.relative(__dirname, SHRINKWRAP_FILENAME)}`)
  }
})

console.log('')
