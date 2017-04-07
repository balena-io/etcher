'use strict';

const m = require('mochainon');
const _ = require('lodash');
const Store = require('../../../lib/gui/models/store');
const settings = require('../../../lib/gui/models/settings');

describe('Browser: settings', function() {

  describe('settings', function() {

    const SUPPORTED_KEYS = _.keys(Store.Defaults.get('settings').toJS());

    beforeEach(function() {
      this.settings = settings.getAll();
    });

    afterEach(function() {
      _.each(SUPPORTED_KEYS, (supportedKey) => {
        settings.set(supportedKey, this.settings[supportedKey]);
      });
    });

    it('should be able to set and read values', function() {
      const keyUnderTest = _.first(SUPPORTED_KEYS);
      const originalValue = settings.get(keyUnderTest);

      settings.set(keyUnderTest, !originalValue);
      m.chai.expect(settings.get(keyUnderTest)).to.equal(!originalValue);
      settings.set(keyUnderTest, originalValue);
      m.chai.expect(settings.get(keyUnderTest)).to.equal(originalValue);
    });

    describe('.set()', function() {

      it('should throw if the key is not supported', function() {
        m.chai.expect(function() {
          settings.set('foobar', true);
        }).to.throw('Unsupported setting: foobar');
      });

      it('should throw if no key', function() {
        m.chai.expect(function() {
          settings.set(null, true);
        }).to.throw('Missing setting key');
      });

      it('should throw if key is not a string', function() {
        m.chai.expect(function() {
          settings.set(1234, true);
        }).to.throw('Invalid setting key: 1234');
      });

      it('should throw if setting an object', function() {
        const keyUnderTest = _.first(SUPPORTED_KEYS);
        m.chai.expect(function() {
          settings.set(keyUnderTest, {
            setting: 1
          });
        }).to.throw('Invalid setting value: [object Object]');
      });

      it('should throw if setting an array', function() {
        const keyUnderTest = _.first(SUPPORTED_KEYS);
        m.chai.expect(function() {
          settings.set(keyUnderTest, [ 1, 2, 3 ]);
        }).to.throw('Invalid setting value: 1,2,3');
      });

      it('should set the key to undefined if no value', function() {
        const keyUnderTest = _.first(SUPPORTED_KEYS);
        settings.set(keyUnderTest);
        m.chai.expect(settings.get(keyUnderTest)).to.be.undefined;
      });

    });

    describe('.getAll()', function() {

      it('should be able to read all values', function() {
        const allValues = settings.getAll();

        _.each(SUPPORTED_KEYS, function(supportedKey) {
          m.chai.expect(allValues[supportedKey]).to.equal(settings.get(supportedKey));
        });
      });

    });

  });
});
