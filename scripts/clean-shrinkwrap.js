/**
 * This script is in charge of generating the `shrinkwrap` file.
 *
 * `npm shrinkwrap` has a bug where it will add optional dependencies
 * to `npm-shrinkwrap.json`, therefore causing errors if these optional
 * dependendencies are platform dependent and you then try to build
 * the project in another platform.
 *
 * As a workaround, we keep a list of platform dependent dependencies in
 * the `shrinkwrapIgnore` property of `package.json`, and manually remove
 * them from `npm-shrinkwrap.json` if they exists.
 *
 * See: https://github.com/npm/npm/issues/2679
 */

'use strict'

const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const packageJSON = require('../package.json')
const NPM_SHRINKWRAP_FILE_PATH = path.join(__dirname, '..', 'npm-shrinkwrap.json')
const shrinkwrapFile = require(NPM_SHRINKWRAP_FILE_PATH)
const platformSpecificDependencies = packageJSON.platformSpecificDependencies
const JSON_INDENTATION_SPACES = 2

console.log('Removing:', platformSpecificDependencies.join(', '))

/**
 * @summary Get a shrinkwrap dependency object
 * @function
 * @private
 *
 * @param {Object} shrinkwrap - the shrinkwrap file contents
 * @param {String[]} shrinkwrapPath - path to shrinkwrap dependency
 * @returns {Object} shrinkwrap object
 *
 * @example
 * const object = getShrinkwrapDependencyObject(require('./npm-shrinkwrap.json'), [
 *   'drivelist',
 *   'lodash'
 * ]);
 *
 * console.log(object.version);
 * console.log(object.dependencies);
 */
const getShrinkwrapDependencyObject = (shrinkwrap, shrinkwrapPath) => {
  return _.reduce(shrinkwrapPath, (accumulator, dependency) => {
    return _.get(accumulator, [ 'dependencies', dependency ], {})
  }, shrinkwrap)
}

/**
 * @summary Get a cleaned shrinkwrap dependency object
 * @function
 * @private
 *
 * @description
 * This function wraps `getShrinkwrapDependencyObject()` to
 * omit unnecessary properties such as `from`, or `dependencies`.
 *
 * @param {Object} shrinkwrap - the shrinkwrap file contents
 * @param {String[]} shrinkwrapPath - path to shrinkwrap dependency
 * @returns {Object} pretty shrinkwrap object
 *
 * @example
 * const object = getPrettyShrinkwrapDependencyObject(require('./npm-shrinkwrap.json'), [
 *   'drivelist',
 *   'lodash'
 * ]);
 *
 * console.log(object.name);
 * console.log(object.path);
 * console.log(object.version);
 */
const getPrettyShrinkwrapDependencyObject = (shrinkwrap, shrinkwrapPath) => {
  const object = getShrinkwrapDependencyObject(shrinkwrap, shrinkwrapPath)

  if (_.isEmpty(object)) {
    return null
  }

  return {
    name: _.last(shrinkwrapPath),
    path: shrinkwrapPath,
    version: object.version,
    development: Boolean(object.dev),
    optional: Boolean(object.optional)
  }
}

/**
 * @summary Get the manifest (package.json) of a shrinkwrap dependency
 * @function
 * @private
 *
 * @param {String[]} shrinkwrapPath - path to shrinkwrap dependency
 * @returns {Object} dependency manifest
 *
 * @example
 * const manifest = getShrinkwrapDependencyManifest([ 'bluebird' ]);
 * console.log(manifest.devDependencies);
 */
const getShrinkwrapDependencyManifest = (shrinkwrapPath) => {
  const manifestPath = _.chain(shrinkwrapPath)
    .flatMap((dependency) => {
      return [ 'node_modules', dependency ]
    })
    .concat([ 'package.json' ])
    .reduce((accumulator, file) => {
      return path.join(accumulator, file)
    }, '.')
    .value()

  try {
    // For example
    // ./node_modules/drivelist/node_modules/lodash/package.json
    return require(`.${path.sep}${manifestPath}`)
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return null
    }

    throw error
  }
}

/**
 * @summary Get the top level dependencies of a shrinkwrap object
 * @function
 * @private
 *
 * @param {String[]} shrinkwrapPath - path to shrinkwrap dependency
 * @returns {Object} top level dependencies
 *
 * @example
 * const dependencies = getTopLevelDependenciesForShrinkwrapPath([ 'debug' ]);
 * console.log(dependencies);
 * > {
 * >   "lodash": "^4.0.0"
 * > }
 */
const getTopLevelDependenciesForShrinkwrapPath = (shrinkwrapPath) => {
  return _.get(getShrinkwrapDependencyManifest(shrinkwrapPath), [ 'dependencies' ], {})
}

/**
 * @summary Get the dependency tree of a shrinkwrap dependency
 * @function
 * @private
 *
 * @param {Object} shrinkwrap - the shrinkwrap file contents
 * @param {String[]} shrinkwrapPath - path to shrinkwrap dependency
 * @returns {Object[]} dependency tree
 *
 * @example
 * const dependencyTree = getDependencyTree(require('./npm-shrinkwrap.json'), [ 'drivelist' ]);
 *
 * _.each(dependencyTree, (dependency) => {
 *   console.log(dependency.name);
 *   console.log(dependency.path);
 *   console.log(dependency.version);
 * })
 */
const getDependencyTree = (shrinkwrap, shrinkwrapPath) => {
  const dependencies = getTopLevelDependenciesForShrinkwrapPath(shrinkwrapPath)

  if (_.isEmpty(dependencies)) {
    return []
  }

  const object = getShrinkwrapDependencyObject(shrinkwrap, shrinkwrapPath)
  const result = _.map(dependencies, (version, name) => {
    const dependencyPath = _.has(object.dependencies, name) ? _.concat(shrinkwrapPath, [ name ]) : [ name ]
    return getPrettyShrinkwrapDependencyObject(shrinkwrap, dependencyPath)
  })

  return _.concat(result, _.flatMapDeep(result, (dependency) => {
    return getDependencyTree(shrinkwrap, dependency.path)
  }))
}

/**
 * @summary Remove certain development optional dependencies from a shrinkwrap file
 * @function
 * @private
 *
 * @description
 * A shrinkwrap object is a recursive data structure, that apart
 * from some extra metadata, has the following structure:
 *
 * {
 *   ...
 *   "dependencies": {
 *     "<dependency_name>": <recursive definition>,
 *     "<dependency_name>": <recursive definition>,
 *     "<dependency_name>": <recursive definition>,
 *     ...
 *   }
 * }
 *
 * The purpose of this function is to remove certain dependencies
 * that match a blacklist. In order to do so, we start from the top
 * level object, remove the blacklisted dependencies, and recurse
 * if possible.
 *
 * @param {Object} shrinkwrap - the shrinkwrap object
 * @param {Object[]} blacklist - dependency blacklist
 * @returns {Object} filtered shrinkwrap object
 *
 * @example
 * const shrinkwrapFile = require('./npm-shrinkwrap.json');
 * const dependencyTree = getDependencyTree(shrinkwrapFile, [ 'drivelist' ]);
 * const filteredShrinkwrap = removeOptionalDevelopmentDependencies(shrinkwrapFile, dependencyTree);
 */
const removeOptionalDevelopmentDependencies = (shrinkwrap, blacklist) => {
  if (!_.isEmpty(shrinkwrap.dependencies)) {
    shrinkwrap.dependencies = _.chain(shrinkwrap.dependencies)
      .omitBy((dependency, name) => {
        return _.every([
          _.find(blacklist, {
            name,
            version: dependency.version
          }),
          dependency.dev,
          dependency.optional
        ])
      })
      .mapValues((dependency) => {
        return removeOptionalDevelopmentDependencies(dependency, blacklist)
      })
      .value()
  }

  return shrinkwrap
}

/**
 * @summary Get the dependency tree of a dependency plus the dependency itself
 * @function
 * @private
 *
 * @param {Object} shrinkwrap - the shrinkwrap file contents
 * @param {String[]} shrinkwrapPath - path to shrinkwrap dependency
 * @returns {Object[]} tree
 *
 * @example
 * const tree = getTree(require('./npm-shrinkwrap.json'), [ 'drivelist' ]);
 *
 * _.each(tree, (dependency) => {
 *   console.log(dependency.name);
 *   console.log(dependency.path);
 *   console.log(dependency.version);
 * });
 */
const getTree = (shrinkwrap, shrinkwrapPath) => {
  return _.compact(_.concat([
    getPrettyShrinkwrapDependencyObject(shrinkwrap, shrinkwrapPath)
  ], getDependencyTree(shrinkwrap, shrinkwrapPath)))
}

const blacklist = _.reduce(platformSpecificDependencies, (accumulator, dependencyPath) => {
  return _.concat(accumulator, getTree(shrinkwrapFile, dependencyPath))
}, [])

const filteredShrinkwrap = removeOptionalDevelopmentDependencies(shrinkwrapFile, blacklist)
const result = JSON.stringify(filteredShrinkwrap, null, JSON_INDENTATION_SPACES)

fs.writeFileSync(NPM_SHRINKWRAP_FILE_PATH, `${result}\n`)
console.log('Done')
