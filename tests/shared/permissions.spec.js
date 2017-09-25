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
const os = require('os')
const permissions = require('../../lib/shared/permissions')

describe('Shared: permissions', function () {
  describe('.getEnvironmentCommandPrefix()', function () {
    describe('given windows', function () {
      beforeEach(function () {
        this.osPlatformStub = m.sinon.stub(os, 'platform')
        this.osPlatformStub.returns('win32')
      })

      afterEach(function () {
        this.osPlatformStub.restore()
      })

      it('should return an empty array if no environment', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix()).to.deep.equal([])
      })

      it('should return an empty array if the environment is an empty object', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({})).to.deep.equal([])
      })

      it('should create an environment command prefix out of one variable', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar'
        })).to.deep.equal([
          'set',
          'FOO=bar',
          '&&',
          'call'
        ])
      })

      it('should create an environment command prefix out of many variables', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar',
          BAR: 'baz',
          BAZ: 'qux'
        })).to.deep.equal([
          'set',
          'FOO=bar',
          '&&',
          'set',
          'BAR=baz',
          '&&',
          'set',
          'BAZ=qux',
          '&&',
          'call'
        ])
      })

      it('should ignore undefined and null variable values', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: null,
          BAR: 'qux',
          BAZ: undefined
        })).to.deep.equal([
          'set',
          'BAR=qux',
          '&&',
          'call'
        ])
      })

      it('should stringify number values', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 1,
          BAR: 0,
          BAZ: -1
        })).to.deep.equal([
          'set',
          'FOO=1',
          '&&',
          'set',
          'BAR=0',
          '&&',
          'set',
          'BAZ=-1',
          '&&',
          'call'
        ])
      })
    })

    describe('given linux', function () {
      beforeEach(function () {
        this.osPlatformStub = m.sinon.stub(os, 'platform')
        this.osPlatformStub.returns('linux')
      })

      afterEach(function () {
        this.osPlatformStub.restore()
      })

      it('should return an empty array if no environment', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix()).to.deep.equal([])
      })

      it('should return an empty array if the environment is an empty object', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({})).to.deep.equal([])
      })

      it('should create an environment command prefix out of one variable', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar'
        })).to.deep.equal([
          'env',
          'FOO=bar'
        ])
      })

      it('should create an environment command prefix out of many variables', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar',
          BAR: 'baz',
          BAZ: 'qux'
        })).to.deep.equal([
          'env',
          'FOO=bar',
          'BAR=baz',
          'BAZ=qux'
        ])
      })

      it('should ignore undefined and null variable values', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: null,
          BAR: 'qux',
          BAZ: undefined
        })).to.deep.equal([
          'env',
          'BAR=qux'
        ])
      })

      it('should stringify number values', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 1,
          BAR: 0,
          BAZ: -1
        })).to.deep.equal([
          'env',
          'FOO=1',
          'BAR=0',
          'BAZ=-1'
        ])
      })
    })

    describe('given darwin', function () {
      beforeEach(function () {
        this.osPlatformStub = m.sinon.stub(os, 'platform')
        this.osPlatformStub.returns('darwin')
      })

      afterEach(function () {
        this.osPlatformStub.restore()
      })

      it('should return an empty array if no environment', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix()).to.deep.equal([])
      })

      it('should return an empty array if the environment is an empty object', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({})).to.deep.equal([])
      })

      it('should create an environment command prefix out of one variable', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar'
        })).to.deep.equal([
          'env',
          'FOO=bar'
        ])
      })

      it('should create an environment command prefix out of many variables', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar',
          BAR: 'baz',
          BAZ: 'qux'
        })).to.deep.equal([
          'env',
          'FOO=bar',
          'BAR=baz',
          'BAZ=qux'
        ])
      })

      it('should ignore undefined and null variable values', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: null,
          BAR: 'qux',
          BAZ: undefined
        })).to.deep.equal([
          'env',
          'BAR=qux'
        ])
      })

      it('should stringify number values', function () {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 1,
          BAR: 0,
          BAZ: -1
        })).to.deep.equal([
          'env',
          'FOO=1',
          'BAR=0',
          'BAZ=-1'
        ])
      })
    })
  })
})
