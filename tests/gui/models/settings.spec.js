'use strict';

const m = require('mochainon');
const _ = require('lodash');
const Store = require('../../../lib/gui/models/store');
const settings = require('../../../lib/gui/models/settings');

describe('Browser: settings', function() {

  const DEFAULT_SETTINGS = Store.Defaults.get('settings').toJS();

  beforeEach(function() {
    return settings.setAll(DEFAULT_SETTINGS);
  });

  it('should be able to set and read boolean values', function(done) {
    settings.set('foo', true).then(() => {
      m.chai.expect(settings.get('foo')).to.equal(true);
    }).then(() => {
      return settings.set('foo', false);
    }).then(() => {
      m.chai.expect(settings.get('foo')).to.equal(false);
      done();
    }).catch(done);
  });

  it('should be able to set and read number values', function(done) {
    settings.set('foo', 1).then(() => {
      m.chai.expect(settings.get('foo')).to.equal(1);
    }).then(() => {
      return settings.set('foo', -50);
    }).then(() => {
      m.chai.expect(settings.get('foo')).to.equal(-50);
      done();
    }).catch(done);
  });

  it('should be able to set and read string values', function(done) {
    settings.set('foo', 'bar').then(() => {
      m.chai.expect(settings.get('foo')).to.equal('bar');
    }).then(() => {
      return settings.set('foo', 'baz');
    }).then(() => {
      m.chai.expect(settings.get('foo')).to.equal('baz');
      done();
    }).catch(done);
  });

  describe('.set()', function() {

    it('should throw if no key', function(done) {
      settings.set(null, true).catch((error) => {
        m.chai.expect(error.message).to.equal('Missing setting key');
        done();
      }).catch(done);
    });

    it('should throw if key is not a string', function(done) {
      settings.set(1234, true).catch((error) => {
        m.chai.expect(error.message).to.equal('Invalid setting key: 1234');
        done();
      }).catch(done);
    });

    it('should set the key to undefined if no value', function(done) {
      settings.set('foo').then(() => {
        m.chai.expect(settings.get('foo')).to.be.undefined;
        done();
      }).catch(done);
    });

  });

  describe('.getAll()', function() {

    it('should initially read the default values', function() {
      const allValues = settings.getAll();
      m.chai.expect(allValues).to.deep.equal(DEFAULT_SETTINGS);
    });

    it('should read all values after an update', function(done) {
      settings.set('foo', 'bar').then(() => {
        const allValues = settings.getAll();
        m.chai.expect(allValues).to.deep.equal(_.merge(_.clone(DEFAULT_SETTINGS), {
          foo: 'bar'
        }));
        done();
      }).catch(done);
    });

  });

});
