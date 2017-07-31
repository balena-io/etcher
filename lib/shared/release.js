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

'use strict';

const _ = require('lodash');
const semver = require('semver');

/**
 * @summary Check if a version is a stable release
 * @function
 * @public
 *
 * @param {String} version - version
 * @returns {Boolean} whether the version is a stable release
 *
 * @example
 * if (release.isStableRelease('1.0.0')) {
 *   console.log('This is a stable release');
 * }
 */
exports.isStableRelease = (version) => {
  const parsedVersion = semver.parse(version);
  return _.every([
    _.isEmpty(_.get(parsedVersion, [ 'prerelease' ])),
    _.isEmpty(_.get(parsedVersion, [ 'build' ]))
  ]);
};
