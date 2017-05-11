/*
 * Copyright 2016 resin.io
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
const cli = require('../../lib/child-writer/cli');

describe('ChildWriter CLI', function() {

  describe('.getBooleanArgumentForm()', function() {

    it('should prepend --no if the value is false and option is long', function() {
      m.chai.expect(cli.getBooleanArgumentForm('foo', false)).to.equal('--no-foo');
    });

    it('should prepend -- if the value is true and option is long', function() {
      m.chai.expect(cli.getBooleanArgumentForm('foo', true)).to.equal('--foo');
    });

    it('should prepend --no if the value is false and option is short', function() {
      m.chai.expect(cli.getBooleanArgumentForm('x', false)).to.equal('--no-x');
    });

    it('should prepend - if the value is true and option is short', function() {
      m.chai.expect(cli.getBooleanArgumentForm('x', true)).to.equal('-x');
    });

  });

  describe('.getArguments()', function() {

    it('should return a list of arguments given validate = false, eject = false', function() {
      m.chai.expect(cli.getArguments({
        image: 'path/to/image.img',
        device: '/dev/disk2',
        entryPoint: 'path/to/app.asar',
        validateWriteOnSuccess: false,
        ejectOnSuccess: false
      })).to.deep.equal([
        'path/to/app.asar',
        'path/to/image.img',
        '--drive',
        '/dev/disk2',
        '--no-eject',
        '--no-check'
      ]);
    });

    it('should return a list of arguments given validate = false, eject = true', function() {
      m.chai.expect(cli.getArguments({
        image: 'path/to/image.img',
        device: '/dev/disk2',
        entryPoint: 'path/to/app.asar',
        validateWriteOnSuccess: false,
        ejectOnSuccess: true
      })).to.deep.equal([
        'path/to/app.asar',
        'path/to/image.img',
        '--drive',
        '/dev/disk2',
        '--eject',
        '--no-check'
      ]);
    });

    it('should return a list of arguments given validate = true, eject = false', function() {
      m.chai.expect(cli.getArguments({
        image: 'path/to/image.img',
        device: '/dev/disk2',
        entryPoint: 'path/to/app.asar',
        validateWriteOnSuccess: true,
        ejectOnSuccess: false
      })).to.deep.equal([
        'path/to/app.asar',
        'path/to/image.img',
        '--drive',
        '/dev/disk2',
        '--no-eject',
        '--check'
      ]);
    });

    it('should return a list of arguments given validate = true, eject = true', function() {
      m.chai.expect(cli.getArguments({
        image: 'path/to/image.img',
        device: '/dev/disk2',
        entryPoint: 'path/to/app.asar',
        validateWriteOnSuccess: true,
        ejectOnSuccess: true
      })).to.deep.equal([
        'path/to/app.asar',
        'path/to/image.img',
        '--drive',
        '/dev/disk2',
        '--eject',
        '--check'
      ]);
    });

  });

});
