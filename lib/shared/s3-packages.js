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

'use strict'

const _ = require('lodash')
const semver = require('semver')
const Bluebird = require('bluebird')
const request = Bluebird.promisifyAll(require('request'))
const xml = Bluebird.promisifyAll(require('xml2js'))
const release = require('./release')
const errors = require('./errors')

/**
 * @summary Etcher S3 bucket URLs
 * @namespace BUCKET_URL
 * @public
 */
exports.BUCKET_URL = {

  /**
   * @property {String} PRODUCTION
   * @memberof BUCKET_URL
   * @description
   * Etcher production S3 bucket URL
   */
  PRODUCTION: 'https://resin-production-downloads.s3.amazonaws.com',

  /**
   * @property {String} SNAPSHOT
   * @memberof BUCKET_URL
   * @description
   * Etcher snapshot S3 bucket URL
   */
  SNAPSHOT: 'https://resin-nightly-downloads.s3.amazonaws.com'

}

/**
 * @summary Etcher S3 package name
 * @constant
 * @private
 * @type {String}
 */
const S3_PACKAGE_NAME = 'etcher'

/**
 * @summary Number of packages per Etcher version
 * @constant
 * @private
 * @type {Number}
 */
const NUMBER_OF_PACKAGES = 8

/**
 * @summary Get the correct S3 bucket url from a release type
 * @function
 * @private
 *
 * @param {RELEASE_TYPE} releaseType - release type
 * @returns {?String} S3 bucket url
 *
 * @example
 * const bucketUrl = s3Packages.getBucketUrlFromReleaseType(release.RELEASE_TYPE.PRODUCTION);
 *
 * if (bucketUrl) {
 *   console.log(bucketUrl);
 * }
 */
exports.getBucketUrlFromReleaseType = (releaseType) => {
  if (releaseType === release.RELEASE_TYPE.PRODUCTION) {
    return exports.BUCKET_URL.PRODUCTION
  }

  if (releaseType === release.RELEASE_TYPE.SNAPSHOT) {
    return exports.BUCKET_URL.SNAPSHOT
  }

  return null
}

/**
 * @summary Get all remote versions from an S3 bucket
 * @function
 * @private
 *
 * @description
 * We memoize based on the assumption that the received latest version
 * number will not increase while the application is running.
 *
 * @param {String} bucketUrl - s3 bucket url
 * @fulfil {String[]} - remote versions
 * @returns {Promise}
 *
 * @example
 * s3Packages.getRemoteVersions(s3Packages.BUCKET_URL.PRODUCTION).then((versions) => {
 *   _.each(versions, (version) => {
 *     console.log(version);
 *   });
 * });
 */
exports.getRemoteVersions = _.memoize((bucketUrl) => {
  if (_.isNil(bucketUrl)) {
    return Bluebird.reject(new Error(`Invalid bucket url: ${bucketUrl}`))
  }

  /* eslint-disable lodash/prefer-lodash-method */

  return request.getAsync(bucketUrl)

  /* eslint-enable lodash/prefer-lodash-method */

    .get('body')
    .then(xml.parseStringAsync)
    .get('ListBucketResult')
    .then((bucketResult) => {
      return _.get(bucketResult, [ 'Contents' ], [])
    })
    .reduce((accumulator, entry) => {
      const [ name, version ] = _.split(_.first(entry.Key), '/')

      if (name === S3_PACKAGE_NAME) {
        if (_.isNil(accumulator[version])) {
          accumulator[version] = 1
        } else {
          accumulator[version] += 1
        }
      }

      return accumulator
    }, [])
    .then((versions) => {
      return _.keys(_.pickBy(versions, (occurrences) => {
        return occurrences >= NUMBER_OF_PACKAGES
      }))
    })
    .catch({
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
      code: 'EHOSTDOWN'
    }, {

      // May happen when behind a proxy
      code: 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'

    }, {

      // May happen when behind a proxy
      code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'

    }, (error) => {
      throw errors.createUserError({
        title: 'Unable to check for updates',
        description: `We got an ${error.code} error in response`,
        code: 'UPDATE_USER_ERROR'
      })
    })
})

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
  const strippedVersion = `${semver.major(version)}.${semver.minor(version)}.${semver.patch(version)}`

  return semver.satisfies(strippedVersion, range)
}

/**
 * @summary Get the latest available version for a given release type
 * @function
 * @public
 *
 * @param {String} releaseType - release type
 * @param {Object} [options] - options
 * @param {String} [options.range] - semver range
 * @param {Boolean} [options.includeUnstableChannel=false] - include unstable channel
 * @fulfil {(String|undefined)} - latest version
 * @returns {Promise}
 *
 * @example
 * s3Packages.getLatestVersion(release.RELEASE_TYPE.PRODUCTION, {
 *   range: '>=2.0.0',
 *   includeUnstableChannel: true
 * }).then((latestVersion) => {
 *   console.log(`The latest version is: ${latestVersion}`);
 * });
 */
exports.getLatestVersion = (releaseType, options = {}) => {
  // For manual testing purposes
  const ETCHER_FAKE_S3_LATEST_VERSION = process.env.ETCHER_FAKE_S3_LATEST_VERSION
  if (!_.isNil(ETCHER_FAKE_S3_LATEST_VERSION)) {
    if (release.getReleaseType(ETCHER_FAKE_S3_LATEST_VERSION) === releaseType) {
      return Bluebird.resolve(ETCHER_FAKE_S3_LATEST_VERSION)
    }

    return Bluebird.resolve()
  }

  const bucketUrl = exports.getBucketUrlFromReleaseType(releaseType)
  if (_.isNil(bucketUrl)) {
    return Bluebird.reject(new Error(`No bucket URL found for release type: ${releaseType}`))
  }

  /* eslint-disable lodash/prefer-lodash-method */
  return exports.getRemoteVersions(bucketUrl).filter((version) => {
  /* eslint-enable lodash/prefer-lodash-method */
    if (_.some([

      // This check allows us to ignore snapshot builds in production
      // buckets, and viceversa, which could have been uploaded by mistake.
      release.getReleaseType(version) !== releaseType,

      !release.isStableRelease(version) && !options.includeUnstableChannel
    ])) {
      return false
    }

    return semverSatisfies(version, options.range || '*')
  }).then((versions) => {
    return _.last(versions.sort(semver.compare))
  })
}
