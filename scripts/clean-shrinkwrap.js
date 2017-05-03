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

const path = require('path');
const packageJSON = require('../package.json');
const spawn = require('child_process').spawn;
const shrinkwrapIgnore = packageJSON.shrinkwrapIgnore;

console.log('Removing:', shrinkwrapIgnore.join(', '));

/**
 * Run an npm command
 * @param {Array} command - list of arguments
 * @returns {ChildProcess}
 */
const npm = (command) => {
  return spawn('npm', command, {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: [ process.stdin, process.stdout, process.stderr ]
  });
};

npm([ 'rm', '--ignore-scripts' ].concat(shrinkwrapIgnore))
  .once('close', () => {
    console.log('Done.');
  });
