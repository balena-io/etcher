'use strict';

const m = require('mochainon');
const _ = require('lodash');
const Store = require('../../../lib/gui/models/store');
const settings = require('../../../lib/gui/models/settings');
const localSettings = require('../../../lib/gui/models/local-settings');

describe('Browser: settings', function() {

  beforeEach(function() {
    settings.reset();
  });

  const DEFAULT_SETTINGS = Store.Defaults.get('settings').toJS();

  it('should be able to set and read values', function() {
    m.chai.expect(settings.get('foo')).to.be.undefined;
    settings.set('foo', true);
    m.chai.expect(settings.get('foo')).to.be.true;
    settings.set('foo', false);
    m.chai.expect(settings.get('foo')).to.be.false;
  });

  describe('.reset()', function() {

    it('should reset the settings to their default values', function() {
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
      settings.set('foo', 1234);
      m.chai.expect(settings.getAll()).to.not.deep.equal(DEFAULT_SETTINGS);
      settings.reset();
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
    });

    it('should reset the local settings to their default values', function() {
      settings.set('foo', 1234);
      m.chai.expect(localSettings.readAll()).to.not.deep.equal(DEFAULT_SETTINGS);
      settings.reset();
      m.chai.expect(localSettings.readAll()).to.deep.equal(DEFAULT_SETTINGS);
    });

    describe('given the local settings are cleared', function() {

      beforeEach(function() {
        localSettings.clear();
      });

      it('should set the local settings to their default values', function() {
        settings.reset();
        m.chai.expect(localSettings.readAll()).to.deep.equal(DEFAULT_SETTINGS);
      });

    });

  });

  describe('.assign()', function() {

    it('should throw if no settings', function() {
      m.chai.expect(function() {
        settings.assign();
      }).to.throw('Missing setting');
    });

    it('should throw if setting an array', function() {
      m.chai.expect(function() {
        settings.assign({
          foo: 'bar',
          bar: [ 1, 2, 3 ]
        });
      }).to.throw('Invalid setting value: 1,2,3 for bar');
    });

    it('should not override all settings', function() {
      settings.assign({
        foo: 'bar',
        bar: 'baz'
      });

      m.chai.expect(settings.getAll()).to.deep.equal(_.assign({}, DEFAULT_SETTINGS, {
        foo: 'bar',
        bar: 'baz'
      }));
    });

    it('should not store invalid settings to the local machine', function() {
      m.chai.expect(localSettings.readAll().foo).to.be.undefined;

      m.chai.expect(() => {
        settings.assign({
          foo: [ 1, 2, 3 ]
        });
      }).to.throw('Invalid setting value: 1,2,3');

      m.chai.expect(localSettings.readAll().foo).to.be.undefined;
    });

    it('should store the settings to the local machine', function() {
      m.chai.expect(localSettings.readAll().foo).to.be.undefined;
      m.chai.expect(localSettings.readAll().bar).to.be.undefined;

      settings.assign({
        foo: 'bar',
        bar: 'baz'
      });

      m.chai.expect(localSettings.readAll().foo).to.equal('bar');
      m.chai.expect(localSettings.readAll().bar).to.equal('baz');
    });

    it('should not change the application state if storing to the local machine results in an error', function() {
      settings.set('foo', 'bar');
      m.chai.expect(settings.get('foo')).to.equal('bar');

      const localSettingsWriteAllStub = m.sinon.stub(localSettings, 'writeAll');
      localSettingsWriteAllStub.throws(new Error('localSettings error'));

      m.chai.expect(() => {
        settings.assign({
          foo: 'baz'
        });
      }).to.throw('localSettings error');

      localSettingsWriteAllStub.restore();
      m.chai.expect(settings.get('foo')).to.equal('bar');
    });

  });

  describe('.load()', function() {

    it('should extend the application state with the local settings content', function() {
      const object = {
        foo: 'bar'
      };

      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
      localSettings.writeAll(object);
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
      settings.load();
      m.chai.expect(settings.getAll()).to.deep.equal(_.assign({}, DEFAULT_SETTINGS, object));
    });

    it('should keep the application state intact if there are no local settings', function() {
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
      localSettings.clear();
      settings.load();
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
    });

  });

  describe('.set()', function() {

    it('should set an unknown key', function() {
      m.chai.expect(settings.get('foobar')).to.be.undefined;
      settings.set('foobar', true);
      m.chai.expect(settings.get('foobar')).to.be.true;
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
      m.chai.expect(function() {
        settings.set('foo', {
          setting: 1
        });
      }).to.throw('Invalid setting value: [object Object] for foo');
    });

    it('should throw if setting an array', function() {
      m.chai.expect(function() {
        settings.set('foo', [ 1, 2, 3 ]);
      }).to.throw('Invalid setting value: 1,2,3 for foo');
    });

    it('should set the key to undefined if no value', function() {
      settings.set('foo', 'bar');
      m.chai.expect(settings.get('foo')).to.equal('bar');
      settings.set('foo');
      m.chai.expect(settings.get('foo')).to.be.undefined;
    });

    it('should store the setting to the local machine', function() {
      m.chai.expect(localSettings.readAll().foo).to.be.undefined;
      settings.set('foo', 'bar');
      m.chai.expect(localSettings.readAll().foo).to.equal('bar');
    });

    it('should not store invalid settings to the local machine', function() {
      m.chai.expect(localSettings.readAll().foo).to.be.undefined;

      m.chai.expect(() => {
        settings.set('foo', [ 1, 2, 3 ]);
      }).to.throw('Invalid setting value: 1,2,3');

      m.chai.expect(localSettings.readAll().foo).to.be.undefined;
    });

    it('should not change the application state if storing to the local machine results in an error', function() {
      settings.set('foo', 'bar');
      m.chai.expect(settings.get('foo')).to.equal('bar');

      const localSettingsWriteAllStub = m.sinon.stub(localSettings, 'writeAll');
      localSettingsWriteAllStub.throws(new Error('localSettings error'));

      m.chai.expect(() => {
        settings.set('foo', 'baz');
      }).to.throw('localSettings error');

      localSettingsWriteAllStub.restore();
      m.chai.expect(settings.get('foo')).to.equal('bar');
    });

  });

  describe('.getAll()', function() {

    it('should initial return all default values', function() {
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
    });

  });

});
