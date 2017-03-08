'use strict';

const m = require('mochainon');
const _ = require('lodash');
const angular = require('angular');
require('angular-mocks');
const Store = require('../../../lib/gui/models/store');

describe('Browser: SettingsModel', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/models/settings')
  ));

  describe('SettingsModel', function() {

    const SUPPORTED_KEYS = _.keys(Store.Defaults.get('settings').toJS());
    let SettingsModel;

    beforeEach(angular.mock.inject(function(_SettingsModel_) {
      SettingsModel = _SettingsModel_;
    }));

    beforeEach(function() {
      this.settings = SettingsModel.getAll();
    });

    afterEach(function() {
      _.each(SUPPORTED_KEYS, (supportedKey) => {
        SettingsModel.set(supportedKey, this.settings[supportedKey]);
      });
    });

    it('should be able to set and read values', function() {
      const keyUnderTest = _.first(SUPPORTED_KEYS);
      const originalValue = SettingsModel.get(keyUnderTest);

      SettingsModel.set(keyUnderTest, !originalValue);
      m.chai.expect(SettingsModel.get(keyUnderTest)).to.equal(!originalValue);
      SettingsModel.set(keyUnderTest, originalValue);
      m.chai.expect(SettingsModel.get(keyUnderTest)).to.equal(originalValue);
    });

    describe('.set()', function() {

      it('should throw if the key is not supported', function() {
        m.chai.expect(function() {
          SettingsModel.set('foobar', true);
        }).to.throw('Unsupported setting: foobar');
      });

      it('should throw if no key', function() {
        m.chai.expect(function() {
          SettingsModel.set(null, true);
        }).to.throw('Missing setting key');
      });

      it('should throw if key is not a string', function() {
        m.chai.expect(function() {
          SettingsModel.set(1234, true);
        }).to.throw('Invalid setting key: 1234');
      });

      it('should throw if setting an object', function() {
        const keyUnderTest = _.first(SUPPORTED_KEYS);
        m.chai.expect(function() {
          SettingsModel.set(keyUnderTest, {
            setting: 1
          });
        }).to.throw('Invalid setting value: [object Object]');
      });

      it('should throw if setting an array', function() {
        const keyUnderTest = _.first(SUPPORTED_KEYS);
        m.chai.expect(function() {
          SettingsModel.set(keyUnderTest, [ 1, 2, 3 ]);
        }).to.throw('Invalid setting value: 1,2,3');
      });

      it('should set the key to undefined if no value', function() {
        const keyUnderTest = _.first(SUPPORTED_KEYS);
        SettingsModel.set(keyUnderTest);
        m.chai.expect(SettingsModel.get(keyUnderTest)).to.be.undefined;
      });

    });

    describe('.getAll()', function() {

      it('should be able to read all values', function() {
        const allValues = SettingsModel.getAll();

        _.each(SUPPORTED_KEYS, function(supportedKey) {
          m.chai.expect(allValues[supportedKey]).to.equal(SettingsModel.get(supportedKey));
        });
      });

    });

  });
});
