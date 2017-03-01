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

'use strict';

const _ = require('lodash');
const path = require('path');
const jsonfile = require('jsonfile');
const childProcess = require('child_process');
const packageJSON = require('../package.json');
const shrinkwrapIgnore = _.union(packageJSON.shrinkwrapIgnore, _.keys(packageJSON.optionalDependencies));
const EXIT_CODES = require('../lib/shared/exit-codes');
const SHRINKWRAP_PATH = path.join(__dirname, '..', 'npm-shrinkwrap.json');

try {
  console.log(childProcess.execSync('npm shrinkwrap', {
    cwd: path.dirname(SHRINKWRAP_PATH)
  }));
} catch (error) {
  console.error(error.stderr.toString());
  process.exit(EXIT_CODES.GENERAL_ERROR);
}

const shrinkwrapContents = jsonfile.readFileSync(SHRINKWRAP_PATH);
shrinkwrapContents.dependencies = _.omit(shrinkwrapContents.dependencies, shrinkwrapIgnore);
jsonfile.writeFileSync(SHRINKWRAP_PATH, shrinkwrapContents, {
  spaces: 2
});
