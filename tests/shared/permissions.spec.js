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
const _ = require('lodash');
const os = require('os');
const permissions = require('../../lib/shared/permissions');

describe('Shared: permissions', function() {

  describe('.getEnvironmentCommandPrefix()', function() {

    describe('given windows', function() {

      beforeEach(function() {
        this.osPlatformStub = m.sinon.stub(os, 'platform');
        this.osPlatformStub.returns('win32');
      });

      afterEach(function() {
        this.osPlatformStub.restore();
      });

      it('should return an empty array if no environment', function() {
        m.chai.expect(permissions.getEnvironmentCommandPrefix()).to.deep.equal([]);
      });

      it('should return an empty array if the environment is an empty object', function() {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({})).to.deep.equal([]);
      });

      it('should quote environment variables with spaces', function() {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar baz'
        })).to.deep.equal([
          'set',
          '"FOO=bar baz"',
          '&&',
          'call'
        ]);
      });

      it('should create an environment command prefix out of one variable', function() {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar'
        })).to.deep.equal([
          'set',
          '"FOO=bar"',
          '&&',
          'call'
        ]);
      });

      it('should create an environment command prefix out of many variables', function() {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 'bar',
          BAR: 'baz',
          BAZ: 'qux'
        })).to.deep.equal([
          'set',
          '"FOO=bar"',
          '&&',
          'set',
          '"BAR=baz"',
          '&&',
          'set',
          '"BAZ=qux"',
          '&&',
          'call'
        ]);
      });

      it('should ignore undefined and null variable values', function() {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: null,
          BAR: 'qux',
          BAZ: undefined
        })).to.deep.equal([
          'set',
          '"BAR=qux"',
          '&&',
          'call'
        ]);
      });

      it('should stringify number values', function() {
        m.chai.expect(permissions.getEnvironmentCommandPrefix({
          FOO: 1,
          BAR: 0,
          BAZ: -1
        })).to.deep.equal([
          'set',
          '"FOO=1"',
          '&&',
          'set',
          '"BAR=0"',
          '&&',
          'set',
          '"BAZ=-1"',
          '&&',
          'call'
        ]);
      });

    });

    _.each([
      'linux',
      'darwin'
    ], (platform) => {

      describe(`given ${platform}`, function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns(platform);
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should return an empty array if no environment', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix()).to.deep.equal([]);
        });

        it('should return an empty array if the environment is an empty object', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({})).to.deep.equal([]);
        });

        it('should quote environment variables with spaces', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar baz'
          })).to.deep.equal([
            'env',
            'FOO=\'bar baz\''
          ]);
        });

        it('should create an environment command prefix out of one variable', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar'
          })).to.deep.equal([
            'env',
            'FOO=\'bar\''
          ]);
        });

        it('should create an environment command prefix out of many variables', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar',
            BAR: 'baz',
            BAZ: 'qux'
          })).to.deep.equal([
            'env',
            'FOO=\'bar\'',
            'BAR=\'baz\'',
            'BAZ=\'qux\''
          ]);
        });

        it('should ignore undefined and null variable values', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: null,
            BAR: 'qux',
            BAZ: undefined
          })).to.deep.equal([
            'env',
            'BAR=\'qux\''
          ]);
        });

        it('should stringify number values', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 1,
            BAR: 0,
            BAZ: -1
          })).to.deep.equal([
            'env',
            'FOO=\'1\'',
            'BAR=\'0\'',
            'BAZ=\'-1\''
          ]);
        });

        it('should not escape double quotes inside values', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar"baz'
          })).to.deep.equal([
            'env',
            'FOO=\'bar"baz\''
          ]);
        });

        it('should escape single quotes inside values', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar\'baz'
          })).to.deep.equal([
            'env',
            'FOO=\'bar\\\'baz\''
          ]);
        });

        it('should not escape ampersands inside values', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar&baz'
          })).to.deep.equal([
            'env',
            'FOO=\'bar&baz\''
          ]);
        });

        it('should not escape dollar signs inside values', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar$baz'
          })).to.deep.equal([
            'env',
            'FOO=\'bar$baz\''
          ]);
        });

        it('should not escape backslashes inside values', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar\\baz'
          })).to.deep.equal([
            'env',
            'FOO=\'bar\\baz\''
          ]);
        });

        it('should not escape backticks inside values', function() {
          m.chai.expect(permissions.getEnvironmentCommandPrefix({
            FOO: 'bar`baz'
          })).to.deep.equal([
            'env',
            'FOO=\'bar`baz\''
          ]);
        });

      });

    });

  });

  describe('.buildElevateCommand()', function() {

    describe('given windows', function() {

      beforeEach(function() {
        this.osPlatformStub = m.sinon.stub(os, 'platform');
        this.osPlatformStub.returns('win32');
        this.originalPlatform = Reflect.getOwnPropertyDescriptor(process, 'platform');
        Reflect.defineProperty(process, 'platform', {
          value: 'win32'
        });
      });

      afterEach(function() {
        this.osPlatformStub.restore();
        Reflect.defineProperty(process, 'platform', this.originalPlatform);
      });

      it('should quote commands and environment variables with spaces', function() {
        m.chai.expect(permissions.buildElevateCommand([
          'foo',
          'hey there',
          'multi word command'
        ], {
          FOO: 'my var',
          BAR: 'foo bar'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=my var" && set "BAR=foo bar" && call "foo" "hey there" "multi word command""'
        ]);
      });

      it('should build a single argument command without environment variables', function() {
        m.chai.expect(permissions.buildElevateCommand([ 'foo' ])).to.deep.equal([
          'cmd.exe',
          '/c',
          '""foo""'
        ]);
      });

      it('should build a multiple argument command without environment variables', function() {
        m.chai.expect(permissions.buildElevateCommand([
          'foo',
          'bar',
          'baz'
        ])).to.deep.equal([
          'cmd.exe',
          '/c',
          '""foo" "bar" "baz""'
        ]);
      });

      it('should build a single argument command with one environment variable', function() {
        m.chai.expect(permissions.buildElevateCommand([ 'foo' ], {
          FOO: 'bar'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=bar" && call "foo""'
        ]);
      });

      it('should build a multiple argument command with one environment variable', function() {
        m.chai.expect(permissions.buildElevateCommand([
          'foo',
          'bar',
          'baz'
        ], {
          FOO: 'bar'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=bar" && call "foo" "bar" "baz""'
        ]);
      });

      it('should build a single argument command with many environment variables', function() {
        m.chai.expect(permissions.buildElevateCommand([ 'foo' ], {
          FOO: 'bar',
          BAR: 'baz',
          BAZ: 'foo'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=bar" && set "BAR=baz" && set "BAZ=foo" && call "foo""'
        ]);
      });

      it('should build a multiple argument command with many environment variables', function() {
        m.chai.expect(permissions.buildElevateCommand([
          'foo',
          'bar',
          'baz'
        ], {
          FOO: 'bar',
          BAR: 'baz',
          BAZ: 'foo'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=bar" && set "BAR=baz" && set "BAZ=foo" && call "foo" "bar" "baz""'
        ]);
      });

      it('should not escape ampersands with a caret', function() {
        m.chai.expect(permissions.buildElevateCommand([
          'foo',
          'bar&baz'
        ], {
          FOO: 'bar'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=bar" && call "foo" "bar&baz""'
        ]);
      });

      it('should not escape semi colons with a caret', function() {
        m.chai.expect(permissions.buildElevateCommand([
          'foo',
          'bar;baz'
        ], {
          FOO: 'bar'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=bar" && call "foo" "bar;baz""'
        ]);
      });

      it('should not escape percentage signs with a caret', function() {
        m.chai.expect(permissions.buildElevateCommand([
          'foo',
          'bar%baz'
        ], {
          FOO: 'bar'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=bar" && call "foo" "bar%baz""'
        ]);
      });

      it('should not escape carets with a caret', function() {
        m.chai.expect(permissions.buildElevateCommand([
          'foo',
          'bar^baz'
        ], {
          FOO: 'bar'
        })).to.deep.equal([
          'cmd.exe',
          '/c',
          '"set "FOO=bar" && call "foo" "bar^baz""'
        ]);
      });

    });

    _.each([
      'linux',
      'darwin'
    ], (platform) => {

      describe(`given ${platform}`, function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns(platform);
          this.originalPlatform = Reflect.getOwnPropertyDescriptor(process, 'platform');
          Reflect.defineProperty(process, 'platform', {
            value: platform
          });
        });

        afterEach(function() {
          this.osPlatformStub.restore();
          Reflect.defineProperty(process, 'platform', this.originalPlatform);
        });

        it('should quote commands and environment variables with spaces', function() {
          m.chai.expect(permissions.buildElevateCommand([
            'foo',
            'hey there',
            'multi word command'
          ], {
            FOO: 'my var',
            BAR: 'foo bar'
          })).to.deep.equal([
            'env',
            'FOO=\'my var\'',
            'BAR=\'foo bar\'',
            '\'foo\'',
            '\'hey there\'',
            '\'multi word command\''
          ]);
        });

        it('should build a single argument command without environment variables', function() {
          m.chai.expect(permissions.buildElevateCommand([ 'foo' ])).to.deep.equal([ '\'foo\'' ]);
        });

        it('should build a multiple argument command without environment variables', function() {
          m.chai.expect(permissions.buildElevateCommand([
            'foo',
            'bar',
            'baz'
          ])).to.deep.equal([
            '\'foo\'',
            '\'bar\'',
            '\'baz\''
          ]);
        });

        it('should build a single argument command with one environment variable', function() {
          m.chai.expect(permissions.buildElevateCommand([ 'foo' ], {
            FOO: 'bar'
          })).to.deep.equal([
            'env',
            'FOO=\'bar\'',
            '\'foo\''
          ]);
        });

        it('should build a multiple argument command with one environment variable', function() {
          m.chai.expect(permissions.buildElevateCommand([
            'foo',
            'bar',
            'baz'
          ], {
            FOO: 'bar'
          })).to.deep.equal([
            'env',
            'FOO=\'bar\'',
            '\'foo\'',
            '\'bar\'',
            '\'baz\''
          ]);
        });

        it('should build a single argument command with many environment variables', function() {
          m.chai.expect(permissions.buildElevateCommand([ 'foo' ], {
            FOO: 'bar',
            BAR: 'baz',
            BAZ: 'foo'
          })).to.deep.equal([
            'env',
            'FOO=\'bar\'',
            'BAR=\'baz\'',
            'BAZ=\'foo\'',
            '\'foo\''
          ]);
        });

        it('should build a multiple argument command with many environment variables', function() {
          m.chai.expect(permissions.buildElevateCommand([
            'foo',
            'bar',
            'baz'
          ], {
            FOO: 'bar',
            BAR: 'baz',
            BAZ: 'foo'
          })).to.deep.equal([
            'env',
            'FOO=\'bar\'',
            'BAR=\'baz\'',
            'BAZ=\'foo\'',
            '\'foo\'',
            '\'bar\'',
            '\'baz\''
          ]);
        });

      });

    });
  });

});
