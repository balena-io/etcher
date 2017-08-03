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

const m = require('mochainon')
const _ = require('lodash')
const release = require('../../lib/shared/release')

describe('Shared: Release', function () {
  describe('.RELEASE_TYPE', function () {
    it('should be a plain object', function () {
      m.chai.expect(_.isPlainObject(release.RELEASE_TYPE)).to.be.true
    })

    it('should contain keys with different values', function () {
      const keys = _.keys(release.RELEASE_TYPE)
      const uniqueValues = _.uniq(_.values(release.RELEASE_TYPE))
      m.chai.expect(_.size(keys)).to.equal(_.size(uniqueValues))
    })
  })

  describe('.getReleaseType()', function () {
    it('should return the unknown release type if the version is not valid semver', function () {
      const releaseType = release.getReleaseType('foo.bar')
      m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.UNKNOWN)
    })

    describe('given the version has a short git commit hash build number', function () {
      it('should return the snapshot release type', function () {
        const releaseType = release.getReleaseType('1.0.0+6374412')
        m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.SNAPSHOT)
      })

      it('should return the snapshot release type if the version has a pre release tag', function () {
        const releaseType = release.getReleaseType('1.0.0-beta.19+6374412')
        m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.SNAPSHOT)
      })
    })

    describe('given the version has a long git commit hash build number', function () {
      it('should return the snapshot release type', function () {
        const releaseType = release.getReleaseType('1.0.0+6374412554b034799bfc6e13b4e39c3f5e6386e6')
        m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.SNAPSHOT)
      })

      it('should return the snapshot release type if the version has a pre release tag', function () {
        const releaseType = release.getReleaseType('1.0.0-beta.19+6374412554b034799bfc6e13b4e39c3f5e6386e6')
        m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.SNAPSHOT)
      })
    })

    describe('given the version has no build number', function () {
      it('should return the production release type', function () {
        const releaseType = release.getReleaseType('1.0.0')
        m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.PRODUCTION)
      })

      it('should return the production release type if the version has a pre release tag', function () {
        const releaseType = release.getReleaseType('1.0.0-beta.19')
        m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.PRODUCTION)
      })
    })

    describe('given a build number that is not a git commit hash', function () {
      it('should return the unknown release type', function () {
        const releaseType = release.getReleaseType('1.0.0+foo')
        m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.UNKNOWN)
      })

      it('should return the unknown release type if the version has a pre release tag', function () {
        const releaseType = release.getReleaseType('1.0.0-beta.19+foo')
        m.chai.expect(releaseType).to.equal(release.RELEASE_TYPE.UNKNOWN)
      })
    })
  })

  describe('.isStableRelease()', function () {
    it('should return true if given a production stable version', function () {
      m.chai.expect(release.isStableRelease('1.0.0')).to.be.true
    })

    it('should return false if given a production release candidate version', function () {
      m.chai.expect(release.isStableRelease('1.0.0-rc.2')).to.be.false
    })

    it('should return false if given a production beta version', function () {
      m.chai.expect(release.isStableRelease('1.0.0-beta.1')).to.be.false
    })

    it('should return false if given a snapshot stable version', function () {
      m.chai.expect(release.isStableRelease('1.0.0+6374412')).to.be.false
    })

    it('should return false if given a snapshot release candidate version', function () {
      m.chai.expect(release.isStableRelease('1.0.0-rc.2+6374412')).to.be.false
    })

    it('should return false if given a snapshot beta version', function () {
      m.chai.expect(release.isStableRelease('1.0.0-beta.1+6374412')).to.be.false
    })
  })
})
