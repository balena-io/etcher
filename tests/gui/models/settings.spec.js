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
const Bluebird = require('bluebird')
const store = require('../../../lib/shared/store')
const settings = require('../../../lib/gui/models/settings')
const localSettings = require('../../../lib/gui/models/local-settings')

describe('Browser: settings', function () {
  beforeEach(function () {
    return settings.reset()
  })

  const DEFAULT_SETTINGS = store.Defaults.get('settings').toJS()

  it('should be able to set and read values', function () {
    m.chai.expect(settings.get('foo')).to.be.undefined
    return settings.set('foo', true).then(() => {
      m.chai.expect(settings.get('foo')).to.be.true
      return settings.set('foo', false)
    }).then(() => {
      m.chai.expect(settings.get('foo')).to.be.false
    })
  })

  describe('.reset()', function () {
    it('should reset the settings to their default values', function () {
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS)
      return settings.set('foo', 1234).then(() => {
        m.chai.expect(settings.getAll()).to.not.deep.equal(DEFAULT_SETTINGS)
        return settings.reset()
      }).then(() => {
        m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS)
      })
    })

    it('should reset the local settings to their default values', function () {
      return settings.set('foo', 1234).then(localSettings.readAll).then((data) => {
        m.chai.expect(data).to.not.deep.equal(DEFAULT_SETTINGS)
        return settings.reset()
      }).then(localSettings.readAll).then((data) => {
        m.chai.expect(data).to.deep.equal(DEFAULT_SETTINGS)
      })
    })

    describe('given the local settings are cleared', function () {
      beforeEach(function () {
        return localSettings.clear()
      })

      it('should set the local settings to their default values', function () {
        return settings.reset().then(localSettings.readAll).then((data) => {
          m.chai.expect(data).to.deep.equal(DEFAULT_SETTINGS)
        })
      })
    })
  })

  describe('.assign()', function () {
    it('should throw if no settings', function (done) {
      settings.assign().asCallback((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error)
        m.chai.expect(error.message).to.equal('Missing settings')
        done()
      })
    })

    it('should throw if setting an array', function (done) {
      settings.assign({
        foo: 'bar',
        bar: [ 1, 2, 3 ]
      }).asCallback((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error)
        m.chai.expect(error.message).to.equal('Invalid setting value: 1,2,3 for bar')
        done()
      })
    })

    it('should not override all settings', function () {
      return settings.assign({
        foo: 'bar',
        bar: 'baz'
      }).then(() => {
        m.chai.expect(settings.getAll()).to.deep.equal(_.assign({}, DEFAULT_SETTINGS, {
          foo: 'bar',
          bar: 'baz'
        }))
      })
    })

    it('should not store invalid settings to the local machine', function () {
      return localSettings.readAll().then((data) => {
        m.chai.expect(data.foo).to.be.undefined

        return new Bluebird((resolve) => {
          settings.assign({
            foo: [ 1, 2, 3 ]
          }).asCallback((error) => {
            m.chai.expect(error).to.be.an.instanceof(Error)
            m.chai.expect(error.message).to.equal('Invalid setting value: 1,2,3 for foo')
            return resolve()
          })
        })
      }).then(localSettings.readAll).then((data) => {
        m.chai.expect(data.foo).to.be.undefined
      })
    })

    it('should store the settings to the local machine', function () {
      return localSettings.readAll().then((data) => {
        m.chai.expect(data.foo).to.be.undefined
        m.chai.expect(data.bar).to.be.undefined

        return settings.assign({
          foo: 'bar',
          bar: 'baz'
        })
      }).then(localSettings.readAll).then((data) => {
        m.chai.expect(data.foo).to.equal('bar')
        m.chai.expect(data.bar).to.equal('baz')
      })
    })

    it('should not change the application state if storing to the local machine results in an error', function (done) {
      settings.set('foo', 'bar').then(() => {
        m.chai.expect(settings.get('foo')).to.equal('bar')

        const localSettingsWriteAllStub = m.sinon.stub(localSettings, 'writeAll')
        localSettingsWriteAllStub.returns(Bluebird.reject(new Error('localSettings error')))

        settings.assign({
          foo: 'baz'
        }).asCallback((error) => {
          m.chai.expect(error).to.be.an.instanceof(Error)
          m.chai.expect(error.message).to.equal('localSettings error')
          localSettingsWriteAllStub.restore()
          m.chai.expect(settings.get('foo')).to.equal('bar')
          done()
        })
      }).catch(done)
    })
  })

  describe('.load()', function () {
    it('should extend the application state with the local settings content', function () {
      const object = {
        foo: 'bar'
      }

      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS)

      return localSettings.writeAll(object).then(() => {
        m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS)
        return settings.load()
      }).then(() => {
        m.chai.expect(settings.getAll()).to.deep.equal(_.assign({}, DEFAULT_SETTINGS, object))
      })
    })

    it('should keep the application state intact if there are no local settings', function () {
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS)
      return localSettings.clear().then(settings.load).then(() => {
        m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS)
      })
    })
  })

  describe('.set()', function () {
    it('should set an unknown key', function () {
      m.chai.expect(settings.get('foobar')).to.be.undefined
      return settings.set('foobar', true).then(() => {
        m.chai.expect(settings.get('foobar')).to.be.true
      })
    })

    it('should reject if no key', function (done) {
      settings.set(null, true).asCallback((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error)
        m.chai.expect(error.message).to.equal('Missing setting key')
        done()
      })
    })

    it('should throw if key is not a string', function (done) {
      settings.set(1234, true).asCallback((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error)
        m.chai.expect(error.message).to.equal('Invalid setting key: 1234')
        done()
      })
    })

    it('should throw if setting an object', function (done) {
      settings.set('foo', {
        setting: 1
      }).asCallback((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error)
        m.chai.expect(error.message).to.equal('Invalid setting value: [object Object] for foo')
        done()
      })
    })

    it('should throw if setting an array', function (done) {
      settings.set('foo', [ 1, 2, 3 ]).asCallback((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error)
        m.chai.expect(error.message).to.equal('Invalid setting value: 1,2,3 for foo')
        done()
      })
    })

    it('should set the key to undefined if no value', function () {
      return settings.set('foo', 'bar').then(() => {
        m.chai.expect(settings.get('foo')).to.equal('bar')
        return settings.set('foo')
      }).then(() => {
        m.chai.expect(settings.get('foo')).to.be.undefined
      })
    })

    it('should store the setting to the local machine', function () {
      return localSettings.readAll().then((data) => {
        m.chai.expect(data.foo).to.be.undefined
        return settings.set('foo', 'bar')
      }).then(localSettings.readAll).then((data) => {
        m.chai.expect(data.foo).to.equal('bar')
      })
    })

    it('should not store invalid settings to the local machine', function () {
      return localSettings.readAll().then((data) => {
        m.chai.expect(data.foo).to.be.undefined

        return new Bluebird((resolve) => {
          settings.set('foo', [ 1, 2, 3 ]).asCallback((error) => {
            m.chai.expect(error).to.be.an.instanceof(Error)
            m.chai.expect(error.message).to.equal('Invalid setting value: 1,2,3 for foo')
            return resolve()
          })
        })
      }).then(localSettings.readAll).then((data) => {
        m.chai.expect(data.foo).to.be.undefined
      })
    })

    it('should not change the application state if storing to the local machine results in an error', function (done) {
      settings.set('foo', 'bar').then(() => {
        m.chai.expect(settings.get('foo')).to.equal('bar')

        const localSettingsWriteAllStub = m.sinon.stub(localSettings, 'writeAll')
        localSettingsWriteAllStub.returns(Bluebird.reject(new Error('localSettings error')))

        settings.set('foo', 'baz').asCallback((error) => {
          m.chai.expect(error).to.be.an.instanceof(Error)
          m.chai.expect(error.message).to.equal('localSettings error')
          localSettingsWriteAllStub.restore()
          m.chai.expect(settings.get('foo')).to.equal('bar')
          done()
        })
      }).catch(done)
    })
  })

  describe('.getAll()', function () {
    it('should initial return all default values', function () {
      m.chai.expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS)
    })
  })
})
