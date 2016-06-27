/**
 * This script is in charge of building a regex of files to ignore
 * when packaging for `electron-packager`'s `ignore` option.
 *
 * See https://github.com/electron-userland/electron-packager/blob/master/usage.txt
 *
 * Usage:
 *
 *   node scripts/packageignore.js
 */

'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const packageJSON = require('../package.json');

const topLevelFiles = fs.readdirSync(path.join(__dirname, '..'));

console.log(_.flatten([
  packageJSON.packageIgnore,

  // Development dependencies
  _.map(_.keys(packageJSON.devDependencies), function(dependency) {
    return path.join('node_modules', dependency);
  }),

  // Top level hidden files
  _.map(_.filter(topLevelFiles, function(file) {
    return _.startsWith(file, '.');
  }), function(file) {
    return '\\' + file;
  }),

  // Top level markdown files
  _.filter(topLevelFiles, function(file) {
    return _.endsWith(file, '.md');
  })

]).join('|'));
