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
const _ = require('lodash');
const errors = require('../../lib/cli/errors');

describe('CLI: Errors', function() {

  describe('.HUMAN_FRIENDLY', function() {

    it('should be a plain object', function() {
      m.chai.expect(_.isPlainObject(errors.HUMAN_FRIENDLY)).to.be.true;
    });

    it('should contain function properties', function() {
      m.chai.expect(_.every(_.map(errors.HUMAN_FRIENDLY, _.isFunction))).to.be.true;
    });

  });

  describe('.getErrorMessage()', function() {

    describe('given errors without code properties', function() {

      it('should understand a string error', function() {
        const error = 'foo bar';
        m.chai.expect(errors.getErrorMessage(error)).to.equal('foo bar');
      });

      it('should return a generic error message if there is none', function() {
        const error = new Error();
        m.chai.expect(errors.getErrorMessage(error)).to.equal('Unknown error');
      });

      it('should return a generic error message if error is an empty string', function() {
        const error = '';
        m.chai.expect(errors.getErrorMessage(error)).to.equal('Unknown error');
      });

      it('should return the error message', function() {
        const error = new Error('foo bar');
        m.chai.expect(errors.getErrorMessage(error)).to.equal('foo bar');
      });

      it('should make use of a description if there is one', function() {
        const error = new Error('foo bar');
        error.description = 'This is a description';
        m.chai.expect(errors.getErrorMessage(error)).to.equal(_.join([
          'foo bar',
          '',
          'This is a description'
        ], '\n'));
      });

    });

    describe('given errors with code properties', function() {

      it('should provide a friendly message for ENOENT', function() {
        const error = new Error('foo bar');
        error.code = 'ENOENT';
        error.path = 'foo.bar';
        const message = 'ENOENT: No such file or directory: foo.bar';
        m.chai.expect(errors.getErrorMessage(error)).to.equal(message);
      });

      it('should provide a friendly message for EPERM', function() {
        const error = new Error('foo bar');
        error.code = 'EPERM';
        const message = 'EPERM: You\'re not authorized to perform this operation';
        m.chai.expect(errors.getErrorMessage(error)).to.equal(message);
      });

      it('should provide a friendly message for EACCES', function() {
        const error = new Error('foo bar');
        error.code = 'EACCES';
        const message = 'EACCES: You don\'t have access to this resource';
        m.chai.expect(errors.getErrorMessage(error)).to.equal(message);
      });

      it('should make use of a description if there is one', function() {
        const error = new Error('foo bar');
        error.code = 'EPERM';
        error.description = 'This is the EPERM description';

        const message = _.join([
          'EPERM: You\'re not authorized to perform this operation',
          '',
          'This is the EPERM description'
        ], '\n');

        m.chai.expect(errors.getErrorMessage(error)).to.equal(message);
      });

      describe('given the code is not recognised', function() {

        it('should make use of the error message', function() {
          const error = new Error('foo bar');
          error.code = 'EFOO';
          const message = 'EFOO: foo bar';
          m.chai.expect(errors.getErrorMessage(error)).to.equal(message);
        });

        it('should return a generic error message if no there is no message', function() {
          const error = new Error();
          error.code = 'EFOO';
          m.chai.expect(errors.getErrorMessage(error)).to.equal('EFOO: Unknown error');
        });

      });

    });

  });

});
