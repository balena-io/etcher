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

        beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _UpdateNotifierService_, _ManifestBindService_) {
          $q = _$q_;
          $rootScope = _$rootScope_;
          UpdateNotifierService = _UpdateNotifierService_;
          ManifestBindService = _ManifestBindService_;
        }));

        beforeEach(function() {
          this.getLatestVersionStub = m.sinon.stub(UpdateNotifierService, 'getLatestVersion');
          this.getLatestVersionStub.returns($q.resolve(ManifestBindService.get('version')));
        });

        afterEach(function() {
          this.getLatestVersionStub.restore();
        });

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

        beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _UpdateNotifierService_) {
          $q = _$q_;
          $rootScope = _$rootScope_;
          UpdateNotifierService = _UpdateNotifierService_;
        }));

        beforeEach(function() {
          this.getLatestVersionStub = m.sinon.stub(UpdateNotifierService, 'getLatestVersion');
          this.getLatestVersionStub.returns($q.resolve('99999.9.9'));
        });

        afterEach(function() {
          this.getLatestVersionStub.restore();
        });

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

        beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _UpdateNotifierService_) {
          $q = _$q_;
          $rootScope = _$rootScope_;
          UpdateNotifierService = _UpdateNotifierService_;
        }));

        beforeEach(function() {
          this.getLatestVersionStub = m.sinon.stub(UpdateNotifierService, 'getLatestVersion');
          this.getLatestVersionStub.returns($q.resolve('0.0.0'));
        });

        afterEach(function() {
          this.getLatestVersionStub.restore();
        });

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

});
