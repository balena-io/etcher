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
const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));
const errors = require('./errors');
const packageJSON = require('../../package.json');

/**
 * @summary The name of the GitHub application repository
 * @type {String}
 * @constant
 */
const APPLICATION_GITHUB_REPOSITORY_NAME = 'etcher';

/**
 * @summary The name of the GitHub application owner
 * @type {String}
 * @constant
 */
const APPLICATION_GITHUB_REPOSITORY_OWNER = 'resin-io';

/**
 * @summary Get all published releases from a GitHub repository
 * @function
 * @private
 *
 * @description
 * We memoize based on the assumption that the received latest version
 * number will not increase while the application is running.
 *
 * @fulfil {Object[]} - published releases
 * @returns {Promise}
 *
 * @example
 * githubReleases.getPublishedReleases().then((releases) => {
 *   _.each(releases, (release) => {
 *     console.log(release.version);
 *     console.log(release.prerelease);
 *   });
 * });
 */
exports.getPublishedReleases = _.memoize(() => {
  return request.getAsync({
    json: true,
    baseUrl: 'https://api.github.com',

    // See https://developer.github.com/v3/repos/releases/
    url: `/repos/${APPLICATION_GITHUB_REPOSITORY_OWNER}/${APPLICATION_GITHUB_REPOSITORY_NAME}/releases`,

    headers: {

      // Explicitly tell GitHub that we consume the v3 API,
      // for future compatibility purposes
      Accept: 'application/vnd.github.v3+json',

      // GitHub rejects requests without a User-Agent
      'User-Agent': `${packageJSON.displayName} - ${packageJSON.version}`

    }
  }).then((response) => {
    if (response.headers['x-ratelimit-remaining'] === '0') {
      return [];
    }

    const HTTP_CODE_OK = 200;
    if (response.statusCode !== HTTP_CODE_OK) {
      throw errors.createUserError({
        title: 'An error occurred when querying GitHub Releases for update information',
        description: `The GitHub API responded with HTTP code: ${response.statusCode}`
      });
    }

    return _.chain(response.body)
      .reject({
        draft: true
      })
      .map((release) => {
        return {
          version: semver.clean(release.tag_name),
          prerelease: release.prerelease
        };
      })
      .value();

  // There is not much we can do in these cases, so lets ignore the
  // error and pretend there is no update. We'll hopefully have more
  // luck the next time the app starts.

  }).catch({
    code: 'ENOTFOUND'
  }, {
    code: 'ECONNRESET'
  }, {
    code: 'ECONNREFUSED'
  }, {
    code: 'EACCES'
  }, {
    code: 'ETIMEDOUT'
  }, {

    // May happen when behind a proxy
    code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'

  }, () => {
    return [];
  });
});

/**
 * @summary Check if a version satisfies a semver range
 * @function
 * @private
 *
 * @description
 * This function is a wrapper around `semver.satisfies`
 * to make it work fine with pre-release versions.
 *
 * @param {String} version - semver version
 * @param {String} range - semver range
 * @returns {Boolean} whether the version satisfies the range
 *
 * @example
 * if (semverSatisfies('1.0.0', '>=1.0.0')) {
 *   console.log('The version satisfies the range');
 * }
 */
const semverSatisfies = (version, range) => {

  // The `semver` module refuses to apply ranges to prerelease versions
  // As a workaround, we drop the prerelease tags, if any, apply the range
  // on that, and keep using the prerelease tag from then on.
  // See https://github.com/npm/node-semver#prerelease-tags
  const strippedVersion = _.join([
    semver.major(version),
    semver.minor(version),
    semver.patch(version)
  ], '.');

  return semver.satisfies(strippedVersion, range);
};

/**
 * @summary Get the latest available version
 * @function
 * @public
 *
 * @param {Object} [options] - options
 * @param {String} [options.range] - semver range
 * @param {Boolean} [options.includePreReleaseChannel=false] - include pre-release channel
 * @fulfil {(String|undefined)} - latest version
 * @returns {Promise}
 *
 * @example
 * githubReleases.getLatestVersion({
 *   range: '>=2.0.0',
 *   includePreReleaseChannel: true
 * }).then((latestVersion) => {
 *   console.log(`The latest version is: ${latestVersion}`);
 * });
 */
exports.getLatestVersion = (options = {}) => {

  // For manual testing purposes
  const ETCHER_FAKE_GITHUB_LATEST_VERSION = process.env.ETCHER_FAKE_GITHUB_LATEST_VERSION;
  if (!_.isNil(ETCHER_FAKE_GITHUB_LATEST_VERSION)) {
    if (!semver.valid(ETCHER_FAKE_GITHUB_LATEST_VERSION)) {
      return Bluebird.resolve();
    }

    return Bluebird.resolve(ETCHER_FAKE_GITHUB_LATEST_VERSION);
  }

  /* eslint-disable lodash/prefer-lodash-method */

  return exports.getPublishedReleases().filter((release) => {

  /* eslint-enable lodash/prefer-lodash-method */

    if (release.prerelease && !options.includePreReleaseChannel) {
      return false;
    }

    return semverSatisfies(release.version, options.range || '*');
  }).then((releases) => {
    return _.last(_.map(releases, 'version').sort(semver.compare));
  });
};
