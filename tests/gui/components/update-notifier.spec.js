'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');

describe('Browser: UpdateNotifier', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/components/update-notifier/update-notifier')
  ));

  describe('UpdateNotifierService', function() {

    describe('.shouldCheckForUpdates()', function() {

      let UpdateNotifierService;
      let SettingsModel;
      let UPDATE_NOTIFIER_SLEEP_TIME;

      beforeEach(angular.mock.inject(function(_UpdateNotifierService_, _SettingsModel_, _UPDATE_NOTIFIER_SLEEP_TIME_) {
        UpdateNotifierService = _UpdateNotifierService_;
        SettingsModel = _SettingsModel_;
        UPDATE_NOTIFIER_SLEEP_TIME = _UPDATE_NOTIFIER_SLEEP_TIME_;
      }));

      describe('given the `sleepUpdateCheck` is disabled', function() {

        beforeEach(function() {
          SettingsModel.set('sleepUpdateCheck', false);
        });

        it('should return true', function() {
          const result = UpdateNotifierService.shouldCheckForUpdates();
          m.chai.expect(result).to.be.true;
        });

      });

      describe('given the `sleepUpdateCheck` is enabled', function() {

        beforeEach(function() {
          SettingsModel.set('sleepUpdateCheck', true);
        });

        describe('given the `lastUpdateNotify` was never updated', function() {

          beforeEach(function() {
            SettingsModel.set('lastUpdateNotify', undefined);
          });

          it('should return true', function() {
            const result = UpdateNotifierService.shouldCheckForUpdates();
            m.chai.expect(result).to.be.true;
          });

        });

        describe('given the `lastUpdateNotify` was very recently updated', function() {

          beforeEach(function() {
            SettingsModel.set('lastUpdateNotify', Date.now() + 1000);
          });

          it('should return false', function() {
            const result = UpdateNotifierService.shouldCheckForUpdates();
            m.chai.expect(result).to.be.false;
          });

        });

        describe('given the `lastUpdateNotify` was updated long ago', function() {

          beforeEach(function() {
            SettingsModel.set('lastUpdateNotify', Date.now() + UPDATE_NOTIFIER_SLEEP_TIME + 1000);
          });

          it('should return true', function() {
            const result = UpdateNotifierService.shouldCheckForUpdates();
            m.chai.expect(result).to.be.true;
          });

          it('should unset the `sleepUpdateCheck` setting', function() {
            m.chai.expect(SettingsModel.get('sleepUpdateCheck')).to.be.true;
            UpdateNotifierService.shouldCheckForUpdates();
            m.chai.expect(SettingsModel.get('sleepUpdateCheck')).to.be.false;
          });

        });

      });

    });

    describe('.isLatestVersion()', function() {

      describe('given the latest version is equal to the current version', function() {

        let $q;
        let $rootScope;
        let UpdateNotifierService;
        let ManifestBindService;

        beforeEach(function() {
          angular.mock.module(function($provide) {
            $provide.value('UpdateNotifierS3Service', {
              getLatestVersion: function() {
                return $q.resolve(ManifestBindService.get('version'));
              }
            });
          });
        });

        beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _UpdateNotifierService_, _ManifestBindService_) {
          $q = _$q_;
          $rootScope = _$rootScope_;
          UpdateNotifierService = _UpdateNotifierService_;
          ManifestBindService = _ManifestBindService_;
        }));

        it('should resolve true', function() {
          let result = null;

          UpdateNotifierService.isLatestVersion().then(function(isLatestVersion) {
            result = isLatestVersion;
          });

          $rootScope.$apply();
          m.chai.expect(result).to.be.true;
        });

      });

      describe('given the latest version is greater than the current version', function() {

        let $q;
        let $rootScope;
        let UpdateNotifierService;

        beforeEach(function() {
          angular.mock.module(function($provide) {
            $provide.value('UpdateNotifierS3Service', {
              getLatestVersion: function() {
                return $q.resolve('99999.9.9');
              }
            });
          });
        });

        beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _UpdateNotifierService_) {
          $q = _$q_;
          $rootScope = _$rootScope_;
          UpdateNotifierService = _UpdateNotifierService_;
        }));

        it('should resolve false', function() {
          let result = null;

          UpdateNotifierService.isLatestVersion().then(function(isLatestVersion) {
            result = isLatestVersion;
          });

          $rootScope.$apply();
          m.chai.expect(result).to.be.false;
        });

      });

      describe('given the latest version is less than the current version', function() {

        let $q;
        let $rootScope;
        let UpdateNotifierService;

        beforeEach(function() {
          angular.mock.module(function($provide) {
            $provide.value('UpdateNotifierS3Service', {
              getLatestVersion: function() {
                return $q.resolve('0.0.0');
              }
            });
          });
        });

        beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _UpdateNotifierService_) {
          $q = _$q_;
          $rootScope = _$rootScope_;
          UpdateNotifierService = _UpdateNotifierService_;
        }));

        it('should resolve true', function() {
          let result = null;

          UpdateNotifierService.isLatestVersion().then(function(isLatestVersion) {
            result = isLatestVersion;
          });

          $rootScope.$apply();
          m.chai.expect(result).to.be.true;
        });

      });

    });

  });

  describe('UpdateNotifierS3Service', function() {

    let UpdateNotifierS3Service;
    let $rootScope;

    beforeEach(angular.mock.inject(function(_$rootScope_, _UpdateNotifierS3Service_) {
      $rootScope = _$rootScope_;
      UpdateNotifierS3Service = _UpdateNotifierS3Service_;
    }));

    describe('given a mocked S3 XML response', function() {

      let $httpBackend;
      let UPDATE_NOTIFIER_URL;

      beforeEach(angular.mock.inject(function($injector) {
        $httpBackend = $injector.get('$httpBackend');
        UPDATE_NOTIFIER_URL = $injector.get('UPDATE_NOTIFIER_URL');

        $httpBackend.whenGET(UPDATE_NOTIFIER_URL).respond(`
          <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
            <Name>resin-production-downloads</Name>
            <Prefix/>
            <Marker/>
            <MaxKeys>1000</MaxKeys>
            <IsTruncated>false</IsTruncated>
            <Contents>
              <Key>etcher/1.0.0-beta.0/Etcher-darwin-x64.dmg</Key>
              <LastModified>2016-03-10T17:34:21.000Z</LastModified>
              <ETag>"5a715255aa25686688bf1e23bc1d3fc6"</ETag>
              <Size>46109720</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
            <Contents>
              <Key>etcher/1.0.0-beta.1/Etcher-darwin-x64.dmg</Key>
              <LastModified>2016-04-08T20:12:03.000Z</LastModified>
              <ETag>"cc1d6d9d53385e3edd099416fcd894c1"</ETag>
              <Size>47071474</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
            <Contents>
              <Key>etcher/1.0.0-beta.2/Etcher-darwin-x64.dmg</Key>
              <LastModified>2016-04-08T19:03:18.000Z</LastModified>
              <ETag>"5f1849f7781197ce2ee6129c16bcd498"</ETag>
              <Size>48650090</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
            <Contents>
              <Key>etcher/1.0.0-beta.3/Etcher-darwin-x64.dmg</Key>
              <LastModified>2016-04-18T01:32:09.000Z</LastModified>
              <ETag>"c173895886f44d115c66e7206ce3dff8"</ETag>
              <Size>50585335</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
            <Contents>
              <Key>etcher/1.0.0-beta.3/Etcher-darwin-x64.zip</Key>
              <LastModified>2016-04-18T01:42:37.000Z</LastModified>
              <ETag>"e9f6e957e65373b232530215d98df141"</ETag>
              <Size>129327442</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
            <Contents>
              <Key>etcher/1.0.0-beta.4/Etcher-darwin-x64.dmg</Key>
              <LastModified>2016-04-22T17:29:49.000Z</LastModified>
              <ETag>"bccb0024c58747a9b7516cbdfc5a7ecb"</ETag>
              <Size>55240852</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
            <Contents>
              <Key>etcher/1.0.0-beta.4/Etcher-darwin-x64.zip</Key>
              <LastModified>2016-04-22T17:43:27.000Z</LastModified>
              <ETag>"c93e26e68b3c4f2b7e8e88e6befc8e64"</ETag>
              <Size>135443284</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
            <Contents>
              <Key>etcher/1.0.0-beta.5/Etcher-darwin-x64.dmg</Key>
              <LastModified>2016-05-04T08:27:11.000Z</LastModified>
              <ETag>"fb596bfdb8bbaf09807b5fc4a940ce14"</ETag>
              <Size>77757305</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
            <Contents>
              <Key>etcher/1.0.0-beta.5/Etcher-darwin-x64.zip</Key>
              <LastModified>2016-05-04T08:39:56.000Z</LastModified>
              <ETag>"3f11c1b6f06644f9ceb2aea4b1947fdf"</ETag>
              <Size>157933876</Size>
              <StorageClass>STANDARD</StorageClass>
            </Contents>
          </ListBucketResult>
        `);
      }));

      afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });

      it('should resolve the latest version', function() {
        $httpBackend.expectGET(UPDATE_NOTIFIER_URL);

        let latestVersion = null;
        UpdateNotifierS3Service.getLatestVersion().then(function(result) {
          latestVersion = result;
        });

        $rootScope.$apply();
        $httpBackend.flush();

        m.chai.expect(latestVersion).to.equal('1.0.0-beta.5');
      });

    });

  });

});
