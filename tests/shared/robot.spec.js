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
const robot = require('../../lib/shared/robot');

describe('Shared: Robot', function() {

  describe('.isEnabled()', function() {

    it('should return false if ETCHER_CLI_ROBOT is not set', function() {
      m.chai.expect(robot.isEnabled({})).to.be.false;
    });

    it('should return true if ETCHER_CLI_ROBOT=1', function() {
      m.chai.expect(robot.isEnabled({
        ETCHER_CLI_ROBOT: 1
      })).to.be.true;
    });

    it('should return false if ETCHER_CLI_ROBOT=0', function() {
      m.chai.expect(robot.isEnabled({
        ETCHER_CLI_ROBOT: 0
      })).to.be.false;
    });

    it('should return true if ETCHER_CLI_ROBOT="true"', function() {
      m.chai.expect(robot.isEnabled({
        ETCHER_CLI_ROBOT: 'true'
      })).to.be.true;
    });

    it('should return false if ETCHER_CLI_ROBOT="false"', function() {
      m.chai.expect(robot.isEnabled({
        ETCHER_CLI_ROBOT: 'false'
      })).to.be.false;
    });

    it('should return true if ETCHER_CLI_ROBOT=true', function() {
      m.chai.expect(robot.isEnabled({
        ETCHER_CLI_ROBOT: true
      })).to.be.true;
    });

    it('should return false if ETCHER_CLI_ROBOT=false', function() {
      m.chai.expect(robot.isEnabled({
        ETCHER_CLI_ROBOT: false
      })).to.be.false;
    });

  });

  describe('.buildMessage()', function() {

    it('should build a message without data', function() {
      const message = robot.buildMessage('hello');
      const result = '{"command":"hello","data":{}}';
      m.chai.expect(message).to.equal(result);
    });

    it('should build a message with data', function() {
      const message = robot.buildMessage('hello', {
        foo: 1,
        bar: 2
      });
      const result = '{"command":"hello","data":{"foo":1,"bar":2}}';
      m.chai.expect(message).to.equal(result);
    });

    it('should throw if data is defined but it not an object', function() {
      m.chai.expect(() => {
        robot.buildMessage('hello', 'world');
      }).to.throw('Invalid data: world');
    });

  });

  describe('.buildErrorMessage()', function() {

    it('should build a message from a simple error', function() {
      const error = new Error('foo');
      const message = robot.buildErrorMessage(error);

      m.chai.expect(JSON.parse(message)).to.deep.equal({
        command: 'error',
        data: {
          message: 'foo',
          stacktrace: error.stack
        }
      });
    });

    it('should save the error description', function() {
      const error = new Error('foo');
      error.description = 'error description';
      const message = robot.buildErrorMessage(error);

      m.chai.expect(JSON.parse(message)).to.deep.equal({
        command: 'error',
        data: {
          message: 'foo',
          description: 'error description',
          stacktrace: error.stack
        }
      });
    });

    it('should save the error code', function() {
      const error = new Error('foo');
      error.code = 'MYERROR';
      const message = robot.buildErrorMessage(error);

      m.chai.expect(JSON.parse(message)).to.deep.equal({
        command: 'error',
        data: {
          message: 'foo',
          code: 'MYERROR',
          stacktrace: error.stack
        }
      });
    });

    it('should handle a string error', function() {
      const message = JSON.parse(robot.buildErrorMessage('foo'));
      m.chai.expect(message.data.message).to.equal('foo');
      m.chai.expect(message.data.stacktrace).to.be.a.string;
      m.chai.expect(_.isEmpty(message.data.stacktrace)).to.be.false;
    });

  });

  describe('.parseMessage()', function() {

    it('should parse a valid message', function() {
      const message = robot.buildMessage('foo', {
        bar: 1
      });

      m.chai.expect(robot.parseMessage(message)).to.deep.equal({
        command: 'foo',
        data: {
          bar: 1
        }
      });
    });

    it('should parse a valid without data', function() {
      const message = robot.buildMessage('foo');
      m.chai.expect(robot.parseMessage(message)).to.deep.equal({
        command: 'foo',
        data: {}
      });
    });

    it('should throw if input is not valid JSON', function() {
      m.chai.expect(() => {
        robot.parseMessage('Hello world\nFoo Bar');
      }).to.throw('Invalid message');
    });

    it('should throw if input has no command', function() {
      m.chai.expect(() => {
        robot.parseMessage('{"data":{"foo":"bar"}}');
      }).to.throw('Invalid message');
    });

    it('should throw if input has no data', function() {
      m.chai.expect(() => {
        robot.parseMessage('{"command":"foo"}');
      }).to.throw('Invalid message');
    });

  });

  describe('.getCommand()', function() {

    it('should get the command of a message', function() {
      const message = robot.parseMessage(robot.buildMessage('hello', {
        foo: 1,
        bar: 2
      }));

      m.chai.expect(robot.getCommand(message)).to.equal('hello');
    });

  });

  describe('.getData()', function() {

    it('should get the data of a message', function() {
      const message = robot.parseMessage(robot.buildMessage('hello', {
        foo: 1,
        bar: 2
      }));

      m.chai.expect(robot.getData(message)).to.deep.equal({
        foo: 1,
        bar: 2
      });
    });

    it('should return an empty object if the message has no data', function() {
      m.chai.expect(robot.getData({
        command: 'foo'
      })).to.deep.equal({});
    });

  });

  describe('.recomposeErrorMessage()', function() {

    it('should return an instance of Error', function() {
      const error = new Error('Foo bar');
      const message = robot.parseMessage(robot.buildErrorMessage(error));
      m.chai.expect(robot.recomposeErrorMessage(message)).to.be.an.instanceof(Error);
    });

    it('should be able to recompose an error object', function() {
      const error = new Error('Foo bar');
      const message = robot.parseMessage(robot.buildErrorMessage(error));
      m.chai.expect(robot.recomposeErrorMessage(message)).to.deep.equal(error);
    });

    it('should be able to recompose an error object with a code', function() {
      const error = new Error('Foo bar');
      error.code = 'FOO';
      const message = robot.parseMessage(robot.buildErrorMessage(error));
      m.chai.expect(robot.recomposeErrorMessage(message)).to.deep.equal(error);
    });

    it('should be able to recompose an error object with a description', function() {
      const error = new Error('Foo bar');
      error.description = 'My description';
      const message = robot.parseMessage(robot.buildErrorMessage(error));
      m.chai.expect(robot.recomposeErrorMessage(message)).to.deep.equal(error);
    });

  });

});
