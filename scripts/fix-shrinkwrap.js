'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

// No magic numbers it is, eslint
const ZERO = 0;
const ONE = 1;
const TWO = 2;
const THOUSAND = 1000;

let time = Date.now();

// Load the shrinkwrap
const SHRINKWRAP_FILE = path.join(__dirname, '..', 'npm-shrinkwrap.json');
const shrinkwrap = JSON.parse(fs.readFileSync(SHRINKWRAP_FILE, 'utf8'));

/**
 * Fix up an issue with the shrinkwrap caused by npm@5.0.3,
 * where nested dependencies in the shrinkwrap have the "resolved"
 * URL as "version" key, and are missing the "resolved" key
 * @param {Object} dependency - dependency
 * @returns {Boolean}
 */
const fixup = (dependency) => {

  // If the dependency version is a URL and
  // the "resolved" key is missing, we need to fix it
  if (!dependency.resolved && /^http(s):/i.test(dependency.version)) {

    // Extract the version number from the registry URL
    const match = dependency.version.match(/(\d+\.\d+\.\d+(-.+)?)\.tgz$/);

    // If something goes wrong, we do not want
    // this to continue in any way; so we crash
    if (!match || !match[ONE]) {
      throw new Error(`Unable to extract version from "${dependency.version}"`);
    }

    // We need to do some property magic here to
    // maintain the same order of keys as npm generates
    // when writing out, to not swap lines and create a diff
    const integrity = dependency.integrity;
    const dependencies = dependency.dependencies;

    Reflect.deleteProperty(dependency, 'integrity');
    Reflect.deleteProperty(dependency, 'dependencies');

    // Set "resolved" to the registry URL,
    // and "version" to the extracted version:
    dependency.resolved = dependency.version;
    dependency.version = match[ONE];

    // Put deleted properties back to maintain key order
    dependency.integrity = integrity;
    dependency.dependencies = dependencies;

    return true;

  }

  return false;

};

/**
 * Walk the shrinkwrap dependency tree,
 * and fix up any mangled versions along the way
 * while counting how many have been fixed (because, why not?)
 * @param {Object} tree - dependency tree
 * @returns {Number}
 */
const walk = (tree) => {

  if (!tree.dependencies) {
    // Nothing to do here
    return ZERO;
  }

  let fixes = ZERO;

  _.forEach(tree.dependencies, (dep) => {
    fixes += fixup(dep) ? ONE : ZERO;
    fixes += walk(dep);
  });

  return fixes;

};

const fixes = walk(shrinkwrap);

// Save the shrinkwrap back
fs.writeFileSync(SHRINKWRAP_FILE, `${JSON.stringify(shrinkwrap, null, TWO)}\n`);

time = (Date.now() - time) / THOUSAND;

console.log(`Fixed up ${fixes} dependencies in ${time.toFixed(TWO)}s`);
