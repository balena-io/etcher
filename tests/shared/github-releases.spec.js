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

const m = require('mochainon');
const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));
const nock = require('nock');
const githubReleases = require('../../lib/shared/github-releases');
const errors = require('../../lib/shared/errors');

describe('Shared: GitHub Releases', function() {

  describe('.getPublishedReleases()', function() {

    beforeEach(function() {
      githubReleases.getPublishedReleases.cache.clear();
    });

    describe('given an empty bucket', function() {

      beforeEach(function() {
        nock('https://api.github.com').get('/repos/resin-io/etcher/releases').reply(200, []);
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should resolve an empty array', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

    describe('given the GitHub rate limit was reached', function() {

      beforeEach(function() {
        nock('https://api.github.com').get('/repos/resin-io/etcher/releases').reply(401, [], {
          'x-ratelimit-remaining': '0'
        });
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should resolve an empty array', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

    describe('given many pre-release versions', function() {

      beforeEach(function() {
        nock('https://api.github.com').get('/repos/resin-io/etcher/releases').reply(200, [

          /* eslint-disable camelcase */

          {
            tag_name: 'v1.0.0-beta.16',
            draft: false,
            prerelease: true
          },
          {
            tag_name: 'v1.0.0-beta.17',
            draft: false,
            prerelease: true
          },
          {
            tag_name: 'v1.0.0-beta.18',
            draft: false,
            prerelease: true
          }

          /* eslint-enable camelcase */

        ]);
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should resolve all the versions', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([
            {
              version: '1.0.0-beta.16',
              prerelease: true
            },
            {
              version: '1.0.0-beta.17',
              prerelease: true
            },
            {
              version: '1.0.0-beta.18',
              prerelease: true
            }
          ]);
          done();
        }).catch(done);
      });

    });

    describe('given many published versions', function() {

      beforeEach(function() {
        nock('https://api.github.com').get('/repos/resin-io/etcher/releases').reply(200, [

          /* eslint-disable camelcase */

          {
            tag_name: 'v1.0.0-beta.16',
            draft: false,
            prerelease: false
          },
          {
            tag_name: 'v1.0.0-beta.17',
            draft: false,
            prerelease: false
          },
          {
            tag_name: 'v1.0.0-beta.18',
            draft: false,
            prerelease: false
          }

          /* eslint-enable camelcase */

        ]);
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should resolve all the available versions', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([
            {
              version: '1.0.0-beta.16',
              prerelease: false
            },
            {
              version: '1.0.0-beta.17',
              prerelease: false
            },
            {
              version: '1.0.0-beta.18',
              prerelease: false
            }
          ]);
          done();
        }).catch(done);
      });

    });

    describe('given many published and unpublished versions', function() {

      beforeEach(function() {
        nock('https://api.github.com').get('/repos/resin-io/etcher/releases').reply(200, [

          /* eslint-disable camelcase */

          {
            tag_name: 'v1.0.0-beta.16',
            draft: false,
            prerelease: false
          },
          {
            tag_name: 'v1.0.0-beta.17',
            draft: false,
            prerelease: false
          },
          {
            tag_name: 'v1.0.0-beta.18',
            draft: true,
            prerelease: false
          }

          /* eslint-enable camelcase */

        ]);
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should resolve all the published versions', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([
            {
              version: '1.0.0-beta.16',
              prerelease: false
            },
            {
              version: '1.0.0-beta.17',
              prerelease: false
            }
          ]);
          done();
        }).catch(done);
      });

    });

    describe('given an unsuccessful request', function() {

      beforeEach(function() {
        nock('https://api.github.com').get('/repos/resin-io/etcher/releases').reply(500);
      });

      afterEach(function() {
        nock.cleanAll();
      });

      it('should be rejected with a user error', function(done) {
        githubReleases.getPublishedReleases().catch((error) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(errors.isUserError(error)).to.be.true;
          done();
        });
      });

    });

    describe('given ENOTFOUND', function() {

      beforeEach(function() {
        const error = new Error('ENOTFOUND');
        error.code = 'ENOTFOUND';

        this.requestGetAsyncStub = m.sinon.stub(request, 'getAsync');
        this.requestGetAsyncStub.returns(Bluebird.reject(error));
      });

      afterEach(function() {
        this.requestGetAsyncStub.restore();
      });

      it('should resolve an empty array', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

    describe('given ETIMEDOUT', function() {

      beforeEach(function() {
        const error = new Error('ETIMEDOUT');
        error.code = 'ETIMEDOUT';

        this.requestGetAsyncStub = m.sinon.stub(request, 'getAsync');
        this.requestGetAsyncStub.returns(Bluebird.reject(error));
      });

      afterEach(function() {
        this.requestGetAsyncStub.restore();
      });

      it('should resolve an empty array', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

    describe('given ECONNRESET', function() {

      beforeEach(function() {
        const error = new Error('ECONNRESET');
        error.code = 'ECONNRESET';

        this.requestGetAsyncStub = m.sinon.stub(request, 'getAsync');
        this.requestGetAsyncStub.returns(Bluebird.reject(error));
      });

      afterEach(function() {
        this.requestGetAsyncStub.restore();
      });

      it('should resolve an empty array', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

    describe('given ECONNREFUSED', function() {

      beforeEach(function() {
        const error = new Error('ECONNREFUSED');
        error.code = 'ECONNREFUSED';

        this.requestGetAsyncStub = m.sinon.stub(request, 'getAsync');
        this.requestGetAsyncStub.returns(Bluebird.reject(error));
      });

      afterEach(function() {
        this.requestGetAsyncStub.restore();
      });

      it('should resolve an empty array', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

    describe('given EACCES', function() {

      beforeEach(function() {
        const error = new Error('EACCES');
        error.code = 'EACCES';

        this.requestGetAsyncStub = m.sinon.stub(request, 'getAsync');
        this.requestGetAsyncStub.returns(Bluebird.reject(error));
      });

      afterEach(function() {
        this.requestGetAsyncStub.restore();
      });

      it('should resolve an empty array', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

    describe('given UNABLE_TO_VERIFY_LEAF_SIGNATURE', function() {

      beforeEach(function() {
        const error = new Error('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
        error.code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';

        this.requestGetAsyncStub = m.sinon.stub(request, 'getAsync');
        this.requestGetAsyncStub.returns(Bluebird.reject(error));
      });

      afterEach(function() {
        this.requestGetAsyncStub.restore();
      });

      it('should resolve an empty array', function(done) {
        githubReleases.getPublishedReleases().then((versions) => {
          m.chai.expect(versions).to.deep.equal([]);
          done();
        }).catch(done);
      });

    });

  });

  describe('.getLatestVersion()', function() {

    describe('given a valid ETCHER_FAKE_GITHUB_LATEST_VERSION environment variable', function() {

      beforeEach(function() {
        process.env.ETCHER_FAKE_GITHUB_LATEST_VERSION = '9.9.9';
      });

      afterEach(function() {
        Reflect.deleteProperty(process.env, 'ETCHER_FAKE_GITHUB_LATEST_VERSION');
      });

      it('should resolve the variable', function(done) {
        githubReleases.getLatestVersion().then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('9.9.9');
          done();
        }).catch(done);
      });

    });

    describe('given a valid snapshot ETCHER_FAKE_GITHUB_LATEST_VERSION environment variable', function() {

      beforeEach(function() {
        process.env.ETCHER_FAKE_GITHUB_LATEST_VERSION = '9.9.9+7b47334';
      });

      afterEach(function() {
        Reflect.deleteProperty(process.env, 'ETCHER_FAKE_GITHUB_LATEST_VERSION');
      });

      it('should resolve the variable', function(done) {
        githubReleases.getLatestVersion().then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('9.9.9+7b47334');
          done();
        }).catch(done);
      });

    });

    describe('given an invalid ETCHER_FAKE_GITHUB_LATEST_VERSION environment variable', function() {

      beforeEach(function() {
        process.env.ETCHER_FAKE_GITHUB_LATEST_VERSION = 'foo';
      });

      afterEach(function() {
        Reflect.deleteProperty(process.env, 'ETCHER_FAKE_GITHUB_LATEST_VERSION');
      });

      it('should resolve undefined', function(done) {
        githubReleases.getLatestVersion().then((latestVersion) => {
          m.chai.expect(latestVersion).to.be.undefined;
          done();
        }).catch(done);
      });

    });

    describe('given no published releases', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should resolve undefined', function(done) {
        githubReleases.getLatestVersion().then((latestVersion) => {
          m.chai.expect(latestVersion).to.be.undefined;
          done();
        }).catch(done);
      });

    });

    describe('given a single final release', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([
          {
            version: '0.5.0',
            prerelease: false
          }
        ]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should resolve the version if includePreReleaseChannel is true', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: true
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('0.5.0');
          done();
        }).catch(done);
      });

      it('should resolve the version if includePreReleaseChannel is false', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: false
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('0.5.0');
          done();
        }).catch(done);
      });

      it('should resolve the version if includePreReleaseChannel is not passed', function(done) {
        githubReleases.getLatestVersion().then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('0.5.0');
          done();
        }).catch(done);
      });

    });

    describe('given a single pre-release', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([
          {
            version: '0.5.0',
            prerelease: true
          }
        ]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should resolve the version if includePreReleaseChannel is true', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: true
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('0.5.0');
          done();
        }).catch(done);
      });

      it('should resolve undefined if includePreReleaseChannel is false', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: false
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.be.undefined;
          done();
        }).catch(done);
      });

      it('should resolve undefined if includePreReleaseChannel is not passed', function(done) {
        githubReleases.getLatestVersion().then((latestVersion) => {
          m.chai.expect(latestVersion).to.be.undefined;
          done();
        }).catch(done);
      });

    });

    describe('given multiple final versions', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([
          {
            version: '2.1.0',
            prerelease: false
          },
          {
            version: '1.0.0',
            prerelease: false
          },
          {
            version: '0.5.0',
            prerelease: false
          },
          {
            version: '0.4.0',
            prerelease: false
          }
        ]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should resolve the latest version', function(done) {
        githubReleases.getLatestVersion().then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('2.1.0');
          done();
        }).catch(done);
      });

    });

    describe('given production v1, v2, and v3 final releases', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([
          {
            version: '3.0.1',
            prerelease: false
          },
          {
            version: '3.0.0',
            prerelease: false
          },
          {
            version: '2.1.1',
            prerelease: false
          },
          {
            version: '2.1.0',
            prerelease: false
          },
          {
            version: '2.0.0',
            prerelease: false
          },
          {
            version: '1.2.0',
            prerelease: false
          },
          {
            version: '1.1.0',
            prerelease: false
          },
          {
            version: '1.0.2',
            prerelease: false
          },
          {
            version: '1.0.1',
            prerelease: false
          },
          {
            version: '1.0.0',
            prerelease: false
          }
        ]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should be able to resolve the latest v1 version with a semver range', function(done) {
        githubReleases.getLatestVersion({
          range: '<2.0.0'
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('1.2.0');
          done();
        }).catch(done);
      });

      it('should be able to resolve the latest v2 version with a semver range', function(done) {
        githubReleases.getLatestVersion({
          range: '>=2.0.0 <3.0.0'
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('2.1.1');
          done();
        }).catch(done);
      });

      it('should be able to resolve the latest v3 version with a semver range', function(done) {
        githubReleases.getLatestVersion({
          range: '>=3.0.0'
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('3.0.1');
          done();
        }).catch(done);
      });

      it('should resolve the latest version if includePreReleaseChannel is true', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: true
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('3.0.1');
          done();
        }).catch(done);
      });

      it('should resolve the latest version if includePreReleaseChannel is false', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: false
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('3.0.1');
          done();
        }).catch(done);
      });

    });

    describe('given unstable and stable versions where the last version is stable', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([
          {
            version: '3.0.1',
            prerelease: false
          },
          {
            version: '3.0.0-beta.2',
            prerelease: true
          },
          {
            version: '3.0.0-beta.1',
            prerelease: true
          },
          {
            version: '2.1.1',
            prerelease: false
          },
          {
            version: '2.1.0-beta.15',
            prerelease: true
          },
          {
            version: '1.0.0',
            prerelease: false
          }
        ]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should resolve the latest stable version if includePreReleaseChannel is false', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: false
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('3.0.1');
          done();
        }).catch(done);
      });

      it('should resolve the latest stable version if includePreReleaseChannel is true', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: true
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('3.0.1');
          done();
        }).catch(done);
      });

    });

    describe('given unstable and stable versions where the last version is unstable', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([
          {
            version: '3.0.2-beta.1',
            prerelease: true
          },
          {
            version: '3.0.1',
            prerelease: false
          },
          {
            version: '3.0.0-beta.2',
            prerelease: true
          },
          {
            version: '3.0.0-beta.1',
            prerelease: true
          },
          {
            version: '2.1.1',
            prerelease: false
          },
          {
            version: '2.1.0-beta.15',
            prerelease: true
          },
          {
            version: '1.0.0',
            prerelease: false
          }
        ]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should resolve the latest stable version if includePreReleaseChannel is false', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: false
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('3.0.1');
          done();
        }).catch(done);
      });

      it('should resolve the latest unstable version if includePreReleaseChannel is true', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: true
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('3.0.2-beta.1');
          done();
        }).catch(done);
      });

    });

    describe('given pre-release production remote versions', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([
          {
            version: '2.0.0-beta.3',
            prerelease: true
          },
          {
            version: '2.0.0-beta.2',
            prerelease: true
          },
          {
            version: '2.0.0-beta.1',
            prerelease: true
          },
          {
            version: '2.0.0-beta.0',
            prerelease: true
          },
          {
            version: '1.0.0-beta.19',
            prerelease: true
          },
          {
            version: '1.0.0-beta.18',
            prerelease: true
          },
          {
            version: '1.0.0-beta.17',
            prerelease: true
          },
          {
            version: '1.0.0-beta.16',
            prerelease: true
          }
        ]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should be able to resolve the latest v2 pre-release version with a non pre-release semver range', function(done) {
        githubReleases.getLatestVersion({
          range: '>=2.0.0',
          includePreReleaseChannel: true
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('2.0.0-beta.3');
          done();
        }).catch(done);
      });

      it('should resolve undefined if includePreReleaseChannel is false', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: false
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.be.undefined;
          done();
        }).catch(done);
      });

    });

    describe('given pre-release snapshot remote versions', function() {

      beforeEach(function() {
        this.getPublishedReleasesStub = m.sinon.stub(githubReleases, 'getPublishedReleases');
        this.getPublishedReleasesStub.returns(Bluebird.resolve([
          {
            version: '2.0.0-beta.3+5370ef2',
            prerelease: true
          },
          {
            version: '2.0.0-beta.2+ff495a4',
            prerelease: true
          },
          {
            version: '2.0.0-beta.1+07b6dd2',
            prerelease: true
          },
          {
            version: '2.0.0-beta.0+4cd8776',
            prerelease: true
          },
          {
            version: '1.0.0-beta.19+7b47334',
            prerelease: true
          },
          {
            version: '1.0.0-beta.18+7fe503c',
            prerelease: true
          },
          {
            version: '1.0.0-beta.17+76aa05f',
            prerelease: true
          },
          {
            version: '1.0.0-beta.16+802d9ab',
            prerelease: true
          }
        ]));
      });

      afterEach(function() {
        this.getPublishedReleasesStub.restore();
      });

      it('should be able to resolve the latest v2 pre-release version with a non pre-release semver range', function(done) {
        githubReleases.getLatestVersion({
          range: '>=2.0.0',
          includePreReleaseChannel: true
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.equal('2.0.0-beta.3+5370ef2');
          done();
        }).catch(done);
      });

      it('should resolve undefined if includePreReleaseChannel is false', function(done) {
        githubReleases.getLatestVersion({
          includePreReleaseChannel: false
        }).then((latestVersion) => {
          m.chai.expect(latestVersion).to.be.undefined;
          done();
        }).catch(done);
      });

    });

  });

});
