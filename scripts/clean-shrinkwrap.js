/*
 * Copyright 2017 resin.io
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

/**
 * This script is in charge of removing platform specific optional
 * dependencies, and their dependencies from the `shrinkwrap` file.
 */

'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const NPM_SHRINKWRAP_FILE_PATH = path.join(__dirname, '..', 'npm-shrinkwrap.json');
const shrinkwrapFile = require(NPM_SHRINKWRAP_FILE_PATH);
const platformSpecificDependencies = require('../package.json').platformSpecificDependencies;

/**
 * @summary Normalize npm qualifiers
 * @function
 * @private
 *
 * @param {String[]} qualifiers - npm qualifiers
 * @returns {String[]} normalized qualifiers
 *
 * @example
 * const qualifiers = normalizeNpmQualifiers([ 'drivelist@^5.0.0', 'electron@1.6.6' ]);
 * console.log(qualifiers);
 * > [ 'drivelist', 'electron' ]
 */
const normalizeNpmQualifiers = (qualifiers) => {
  return _.map(qualifiers, (qualifier) => {
    return _.first(_.split(qualifier, '@'));
  });
};

/**
 * @summary Get the top level dependencies of a certain npm specifier
 * @function
 * @private
 *
 * @param {String} specifier - npm specifier
 * @returns {String[]} top level dependencies
 *
 * @example
 * const dependencies = getTopLevelDependencies('drivelist@^5.0.0');
 */
const getTopLevelDependencies = _.memoize((specifier) => {
  const json = childProcess.execSync(`npm view --json ${specifier} dependencies`, {
    encoding: 'utf8'
  });

  if (!json) {
    return [];
  }

  const data = JSON.parse(json);
  const dependencies = _.isPlainObject(data) ? _.toPairs(data) : _.flatMap(data, _.toPairs);
  return _.uniq(_.map(dependencies, ([ name, version ]) => {
    return `${name}@${version}`;
  }));
});

/**
 * @summary Recursively fetch the dependency tree of an npm specifier
 * @function
 * @private
 *
 * @param {String} specifier - npm specifier
 * @returns {String[]} all dependencies
 *
 * @example
 * const dependencies = getNormalizedDependencyTree('drivelist@^5.0.0');
 */
const getNormalizedDependencyTree = (specifier) => {
  const topLevelDependencies = getTopLevelDependencies(specifier);
  const nestedDependencies = _.flatMapDeep(topLevelDependencies, getNormalizedDependencyTree);
  return _.uniq(_.concat(normalizeNpmQualifiers(topLevelDependencies), nestedDependencies));
};

/**
 * @summary Remove certain dependencies from a shrinkwrap object
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
 * @param {Object} object - shrinkwrap object
 * @param {String[]} blacklist - list of blacklist
 * @param {Object} qualifiers - qualifiers
 * @param {Boolean} qualifiers.dev - development dependency
 * @param {Boolean} qualifiers.optional - optional dependency
 * @returns {Object} filtered shrinkwrap object
 */
const removeDependencies = (object, blacklist, qualifiers) => {
  if (!_.isEmpty(object.dependencies)) {
    object.dependencies = _.chain(object.dependencies)
      .omitBy((dependency, name) => {
        return _.every([
          _.includes(blacklist, name),
          dependency.dev === qualifiers.dev,
          dependency.optional === qualifiers.optional
        ]);
      })
      .mapValues((dependency) => {
        return removeDependencies(dependency, blacklist, qualifiers);
      })
      .value();
  }

  return object;
};

console.log(`Fetching dependency tree for ${_.join(platformSpecificDependencies, ', ')} (this may take a couple of minutes)`);
const blacklist = _.uniq(normalizeNpmQualifiers(
  _.concat(platformSpecificDependencies,
  _.flatMap(platformSpecificDependencies, getNormalizedDependencyTree))));
console.log(`Attempting to remove: ${_.join(blacklist, ', ')}`);

const JSON_INDENTATION_SPACES = 2;
const result = JSON.stringify(removeDependencies(shrinkwrapFile, blacklist, {
  dev: true,
  optional: true
}), null, JSON_INDENTATION_SPACES);

fs.writeFileSync(NPM_SHRINKWRAP_FILE_PATH, `${result}\n`);
console.log('Done');
