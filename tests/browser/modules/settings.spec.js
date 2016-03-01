'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/modules/settings');

describe('Browser: Settings', function() {

  beforeEach(angular.mock.module('Etcher.settings'));

  describe('SettingsService', function() {

    let SettingsService;

    beforeEach(angular.mock.inject(function(_SettingsService_) {
      SettingsService = _SettingsService_;
    }));

    describe('.isConfiguring()', function() {

      it('should initially return false', function() {
        m.chai.expect(SettingsService.isConfiguring()).to.be.false;
      });

    });

    describe('.enter()', function() {

      it('should be able to enter settings', function() {
        m.chai.expect(SettingsService.isConfiguring()).to.be.false;
        SettingsService.enter();
        m.chai.expect(SettingsService.isConfiguring()).to.be.true;
      });

    });

    describe('.leave()', function() {

      it('should be able to leave settings', function() {
        SettingsService.enter();
        m.chai.expect(SettingsService.isConfiguring()).to.be.true;
        SettingsService.leave();
        m.chai.expect(SettingsService.isConfiguring()).to.be.false;
      });

    });

  });

});
