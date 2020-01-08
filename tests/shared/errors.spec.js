/*
 * Copyright 2016 balena.io
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
// eslint-disable-next-line node/no-missing-require
const errors = require('../../lib/shared/errors')

describe('Shared: Errors', function () {
  describe('.HUMAN_FRIENDLY', function () {
    it('should be a plain object', function () {
      m.chai.expect(_.isPlainObject(errors.HUMAN_FRIENDLY)).to.be.true
    })

    it('should contain title and description function properties', function () {
      m.chai.expect(_.every(_.map(errors.HUMAN_FRIENDLY, (error) => {
        return _.isFunction(error.title) && _.isFunction(error.description)
      }))).to.be.true
    })
  })

  describe('.getTitle()', function () {
    it('should accept a string', function () {
      const error = 'This is an error'
      m.chai.expect(errors.getTitle(error)).to.equal('This is an error')
    })

    it('should accept a number 0', function () {
      const error = 0
      m.chai.expect(errors.getTitle(error)).to.equal('0')
    })

    it('should accept a number 1', function () {
      const error = 1
      m.chai.expect(errors.getTitle(error)).to.equal('1')
    })

    it('should accept a number -1', function () {
      const error = -1
      m.chai.expect(errors.getTitle(error)).to.equal('-1')
    })

    it('should accept an array', function () {
      const error = [ 0, 1, 2 ]
      m.chai.expect(errors.getTitle(error)).to.equal('0,1,2')
    })

    it('should return a generic error message if the error is an empty object', function () {
      const error = {}
      m.chai.expect(errors.getTitle(error)).to.equal('An error ocurred')
    })

    it('should return a generic error message if the error is undefined', function () {
      const error = undefined
      m.chai.expect(errors.getTitle(error)).to.equal('An error ocurred')
    })

    it('should return a generic error message if the error is null', function () {
      const error = null
      m.chai.expect(errors.getTitle(error)).to.equal('An error ocurred')
    })

    it('should return the error message', function () {
      const error = new Error('This is an error')
      m.chai.expect(errors.getTitle(error)).to.equal('This is an error')
    })

    it('should return the error code if there is no message', function () {
      const error = new Error()
      error.code = 'MYERROR'
      m.chai.expect(errors.getTitle(error)).to.equal('Error code: MYERROR')
    })

    it('should prioritize the message over the code', function () {
      const error = new Error('Foo bar')
      error.code = 'MYERROR'
      m.chai.expect(errors.getTitle(error)).to.equal('Foo bar')
    })

    it('should prioritize the code over the message if the message is an empty string', function () {
      const error = new Error('')
      error.code = 'MYERROR'
      m.chai.expect(errors.getTitle(error)).to.equal('Error code: MYERROR')
    })

    it('should prioritize the code over the message if the message is a blank string', function () {
      const error = new Error('    ')
      error.code = 'MYERROR'
      m.chai.expect(errors.getTitle(error)).to.equal('Error code: MYERROR')
    })

    it('should understand an error-like object with a code', function () {
      const error = {
        code: 'MYERROR'
      }

      m.chai.expect(errors.getTitle(error)).to.equal('Error code: MYERROR')
    })

    it('should understand an error-like object with a message', function () {
      const error = {
        message: 'Hello world'
      }

      m.chai.expect(errors.getTitle(error)).to.equal('Hello world')
    })

    it('should understand an error-like object with a message and a code', function () {
      const error = {
        message: 'Hello world',
        code: 'MYERROR'
      }

      m.chai.expect(errors.getTitle(error)).to.equal('Hello world')
    })

    it('should display an error code 0', function () {
      const error = new Error()
      error.code = 0
      m.chai.expect(errors.getTitle(error)).to.equal('Error code: 0')
    })

    it('should display an error code 1', function () {
      const error = new Error()
      error.code = 1
      m.chai.expect(errors.getTitle(error)).to.equal('Error code: 1')
    })

    it('should display an error code -1', function () {
      const error = new Error()
      error.code = -1
      m.chai.expect(errors.getTitle(error)).to.equal('Error code: -1')
    })

    it('should not display an empty string error code', function () {
      const error = new Error()
      error.code = ''
      m.chai.expect(errors.getTitle(error)).to.equal('An error ocurred')
    })

    it('should not display a blank string error code', function () {
      const error = new Error()
      error.code = '   '
      m.chai.expect(errors.getTitle(error)).to.equal('An error ocurred')
    })

    it('should return a generic error message if no information was found', function () {
      const error = new Error()
      m.chai.expect(errors.getTitle(error)).to.equal('An error ocurred')
    })

    it('should return a generic error message if no code and the message is empty', function () {
      const error = new Error('')
      m.chai.expect(errors.getTitle(error)).to.equal('An error ocurred')
    })

    it('should return a generic error message if no code and the message is blank', function () {
      const error = new Error('   ')
      m.chai.expect(errors.getTitle(error)).to.equal('An error ocurred')
    })

    it('should rephrase an ENOENT error', function () {
      const error = new Error('ENOENT error')
      error.path = '/foo/bar'
      error.code = 'ENOENT'
      m.chai.expect(errors.getTitle(error)).to.equal('No such file or directory: /foo/bar')
    })

    it('should rephrase an EPERM error', function () {
      const error = new Error('EPERM error')
      error.code = 'EPERM'
      m.chai.expect(errors.getTitle(error)).to.equal('You\'re not authorized to perform this operation')
    })

    it('should rephrase an EACCES error', function () {
      const error = new Error('EACCES error')
      error.code = 'EACCES'
      m.chai.expect(errors.getTitle(error)).to.equal('You don\'t have access to this resource')
    })

    it('should rephrase an ENOMEM error', function () {
      const error = new Error('ENOMEM error')
      error.code = 'ENOMEM'
      m.chai.expect(errors.getTitle(error)).to.equal('Your system ran out of memory')
    })
  })

  describe('.getDescription()', function () {
    it('should return an empty string if the error is a string', function () {
      const error = 'My error'
      m.chai.expect(errors.getDescription(error)).to.equal('')
    })

    it('should return an empty string if the error is a number', function () {
      const error = 0
      m.chai.expect(errors.getDescription(error)).to.equal('')
    })

    it('should return an empty string if the error is an array', function () {
      const error = [ 1, 2, 3 ]
      m.chai.expect(errors.getDescription(error)).to.equal('')
    })

    it('should return an empty string if the error is undefined', function () {
      const error = undefined
      m.chai.expect(errors.getDescription(error)).to.equal('')
    })

    it('should return an empty string if the error is null', function () {
      const error = null
      m.chai.expect(errors.getDescription(error)).to.equal('')
    })

    it('should return an empty string if the error is an empty object', function () {
      const error = {}
      m.chai.expect(errors.getDescription(error)).to.equal('')
    })

    it('should understand an error-like object with a description', function () {
      const error = {
        description: 'My description'
      }

      m.chai.expect(errors.getDescription(error)).to.equal('My description')
    })

    it('should understand an error-like object with a stack', function () {
      const error = {
        stack: 'My stack'
      }

      m.chai.expect(errors.getDescription(error)).to.equal('My stack')
    })

    it('should understand an error-like object with a description and a stack', function () {
      const error = {
        description: 'My description',
        stack: 'My stack'
      }

      m.chai.expect(errors.getDescription(error)).to.equal('My description')
    })

    it('should stringify and beautify an object without any known property', function () {
      const error = {
        name: 'John Doe',
        job: 'Developer'
      }

      m.chai.expect(errors.getDescription(error)).to.equal([
        '{',
        '  "name": "John Doe",',
        '  "job": "Developer"',
        '}'
      ].join('\n'))
    })

    it('should return the stack for a basic error', function () {
      const error = new Error('Foo')
      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should prefer a description property to a stack', function () {
      const error = new Error('Foo')
      error.description = 'My description'
      m.chai.expect(errors.getDescription(error)).to.equal('My description')
    })

    it('should return the stack if the description is an empty string', function () {
      const error = new Error('Foo')
      error.description = ''
      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should return the stack if the description is a blank string', function () {
      const error = new Error('Foo')
      error.description = '   '
      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should get a generic description for ENOENT', function () {
      const error = new Error('Foo')
      error.code = 'ENOENT'
      m.chai.expect(errors.getDescription(error)).to.equal('The file you\'re trying to access doesn\'t exist')
    })

    it('should get a generic description for EPERM', function () {
      const error = new Error('Foo')
      error.code = 'EPERM'
      m.chai.expect(errors.getDescription(error)).to.equal('Please ensure you have necessary permissions for this task')
    })

    it('should get a generic description for EACCES', function () {
      const error = new Error('Foo')
      error.code = 'EACCES'
      const message = 'Please ensure you have necessary permissions to access this resource'
      m.chai.expect(errors.getDescription(error)).to.equal(message)
    })

    it('should get a generic description for ENOMEM', function () {
      const error = new Error('Foo')
      error.code = 'ENOMEM'
      const message = 'Please make sure your system has enough available memory for this task'
      m.chai.expect(errors.getDescription(error)).to.equal(message)
    })

    it('should prefer a description property than a code description', function () {
      const error = new Error('Foo')
      error.code = 'ENOMEM'
      error.description = 'Memory error'
      m.chai.expect(errors.getDescription(error)).to.equal('Memory error')
    })

    describe('given userFriendlyDescriptionsOnly is false', function () {
      it('should return the stack for a basic error', function () {
        const error = new Error('Foo')
        m.chai.expect(errors.getDescription(error, {
          userFriendlyDescriptionsOnly: false
        })).to.equal(error.stack)
      })

      it('should return the stack if the description is an empty string', function () {
        const error = new Error('Foo')
        error.description = ''
        m.chai.expect(errors.getDescription(error, {
          userFriendlyDescriptionsOnly: false
        })).to.equal(error.stack)
      })

      it('should return the stack if the description is a blank string', function () {
        const error = new Error('Foo')
        error.description = '   '
        m.chai.expect(errors.getDescription(error, {
          userFriendlyDescriptionsOnly: false
        })).to.equal(error.stack)
      })
    })

    describe('given userFriendlyDescriptionsOnly is true', function () {
      it('should return an empty string for a basic error', function () {
        const error = new Error('Foo')
        m.chai.expect(errors.getDescription(error, {
          userFriendlyDescriptionsOnly: true
        })).to.equal('')
      })

      it('should return an empty string if the description is an empty string', function () {
        const error = new Error('Foo')
        error.description = ''
        m.chai.expect(errors.getDescription(error, {
          userFriendlyDescriptionsOnly: true
        })).to.equal('')
      })

      it('should return an empty string if the description is a blank string', function () {
        const error = new Error('Foo')
        error.description = '   '
        m.chai.expect(errors.getDescription(error, {
          userFriendlyDescriptionsOnly: true
        })).to.equal('')
      })
    })
  })

  describe('.createError()', function () {
    it('should not be a user error', function () {
      const error = errors.createError({
        title: 'Foo',
        description: 'Something happened'
      })

      m.chai.expect(errors.isUserError(error)).to.be.false
    })

    it('should be a user error if `options.report` is false', function () {
      const error = errors.createError({
        title: 'Foo',
        description: 'Something happened',
        report: false
      })

      m.chai.expect(errors.isUserError(error)).to.be.true
    })

    it('should be a user error if `options.report` evaluates to false', function () {
      const error = errors.createError({
        title: 'Foo',
        description: 'Something happened',
        report: 0
      })

      m.chai.expect(errors.isUserError(error)).to.be.true
    })

    it('should not be a user error if `options.report` is true', function () {
      const error = errors.createError({
        title: 'Foo',
        description: 'Something happened',
        report: true
      })

      m.chai.expect(errors.isUserError(error)).to.be.false
    })

    it('should not be a user error if `options.report` evaluates to true', function () {
      const error = errors.createError({
        title: 'Foo',
        description: 'Something happened',
        report: 1
      })

      m.chai.expect(errors.isUserError(error)).to.be.false
    })

    it('should be an instance of Error', function () {
      const error = errors.createError({
        title: 'Foo',
        description: 'Something happened'
      })

      m.chai.expect(error).to.be.an.instanceof(Error)
    })

    it('should correctly add both a title and a description', function () {
      const error = errors.createError({
        title: 'Foo',
        description: 'Something happened'
      })

      m.chai.expect(errors.getTitle(error)).to.equal('Foo')
      m.chai.expect(errors.getDescription(error)).to.equal('Something happened')
    })

    it('should correctly add a code', function () {
      const error = errors.createError({
        title: 'Foo',
        description: 'Something happened',
        code: 'HELLO'
      })

      m.chai.expect(error.code).to.equal('HELLO')
    })

    it('should correctly add only a title', function () {
      const error = errors.createError({
        title: 'Foo'
      })

      m.chai.expect(errors.getTitle(error)).to.equal('Foo')
      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should ignore an empty description', function () {
      const error = errors.createError({
        title: 'Foo',
        description: ''
      })

      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should ignore a blank description', function () {
      const error = errors.createError({
        title: 'Foo',
        description: '     '
      })

      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should throw if no title', function () {
      m.chai.expect(() => {
        errors.createError({})
      }).to.throw('Invalid error title: undefined')
    })

    it('should throw if there is a description but no title', function () {
      m.chai.expect(() => {
        errors.createError({
          description: 'foo'
        })
      }).to.throw('Invalid error title: undefined')
    })

    it('should throw if title is empty', function () {
      m.chai.expect(() => {
        errors.createError({
          title: ''
        })
      }).to.throw('Invalid error title: ')
    })

    it('should throw if title is blank', function () {
      m.chai.expect(() => {
        errors.createError({
          title: '    '
        })
      }).to.throw('Invalid error title:    ')
    })
  })

  describe('.createUserError()', function () {
    it('should be a user error', function () {
      const error = errors.createUserError({
        title: 'Foo',
        description: 'Something happened'
      })

      m.chai.expect(errors.isUserError(error)).to.be.true
    })

    it('should be an instance of Error', function () {
      const error = errors.createUserError({
        title: 'Foo',
        description: 'Something happened'
      })

      m.chai.expect(error).to.be.an.instanceof(Error)
    })

    it('should correctly add both a title and a description', function () {
      const error = errors.createUserError({
        title: 'Foo',
        description: 'Something happened'
      })

      m.chai.expect(errors.getTitle(error)).to.equal('Foo')
      m.chai.expect(errors.getDescription(error)).to.equal('Something happened')
    })

    it('should correctly add only a title', function () {
      const error = errors.createUserError({
        title: 'Foo'
      })

      m.chai.expect(errors.getTitle(error)).to.equal('Foo')
      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should correctly add a code', function () {
      const error = errors.createUserError({
        title: 'Foo',
        code: 'HELLO'
      })

      m.chai.expect(error.code).to.equal('HELLO')
    })

    it('should ignore an empty description', function () {
      const error = errors.createUserError({
        title: 'Foo',
        description: ''
      })

      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should ignore a blank description', function () {
      const error = errors.createUserError({
        title: 'Foo',
        description: '     '
      })

      m.chai.expect(errors.getDescription(error)).to.equal(error.stack)
    })

    it('should throw if no title', function () {
      m.chai.expect(() => {
        errors.createUserError({})
      }).to.throw('Invalid error title: undefined')
    })

    it('should throw if title is empty', function () {
      m.chai.expect(() => {
        errors.createUserError({
          title: ''
        })
      }).to.throw('Invalid error title: ')
    })

    it('should throw if there is a description but no title', function () {
      m.chai.expect(() => {
        errors.createUserError({
          description: 'foo'
        })
      }).to.throw('Invalid error title: undefined')
    })

    it('should throw if title is blank', function () {
      m.chai.expect(() => {
        errors.createUserError({
          title: '   '
        })
      }).to.throw('Invalid error title:    ')
    })
  })

  describe('.isUserError()', function () {
    _.each([
      0,
      '',
      false
    ], (value) => {
      it(`should return true if report equals ${value}`, function () {
        const error = new Error('foo bar')
        error.report = value
        m.chai.expect(errors.isUserError(error)).to.be.true
      })
    })

    _.each([
      undefined,
      null,
      true,
      1,
      3,
      'foo'
    ], (value) => {
      it(`should return false if report equals ${value}`, function () {
        const error = new Error('foo bar')
        error.report = value
        m.chai.expect(errors.isUserError(error)).to.be.false
      })
    })
  })

  describe('.toJSON()', function () {
    it('should convert a simple error', function () {
      const error = new Error('My error')
      m.chai.expect(errors.toJSON(error)).to.deep.equal({
        code: undefined,
        description: undefined,
        message: 'My error',
        stack: error.stack,
        report: undefined,
        stderr: undefined,
        stdout: undefined,
        syscall: undefined,
        name: 'Error',
        errno: undefined,
        device: undefined
      })
    })

    it('should convert an error with a description', function () {
      const error = new Error('My error')
      error.description = 'My description'

      m.chai.expect(errors.toJSON(error)).to.deep.equal({
        code: undefined,
        description: 'My description',
        message: 'My error',
        stack: error.stack,
        report: undefined,
        stderr: undefined,
        stdout: undefined,
        syscall: undefined,
        name: 'Error',
        errno: undefined,
        device: undefined
      })
    })

    it('should convert an error with a code', function () {
      const error = new Error('My error')
      error.code = 'ENOENT'

      m.chai.expect(errors.toJSON(error)).to.deep.equal({
        code: 'ENOENT',
        description: undefined,
        message: 'My error',
        stack: error.stack,
        report: undefined,
        stderr: undefined,
        stdout: undefined,
        syscall: undefined,
        name: 'Error',
        errno: undefined,
        device: undefined
      })
    })

    it('should convert an error with a description and a code', function () {
      const error = new Error('My error')
      error.description = 'My description'
      error.code = 'ENOENT'

      m.chai.expect(errors.toJSON(error)).to.deep.equal({
        code: 'ENOENT',
        description: 'My description',
        message: 'My error',
        stack: error.stack,
        report: undefined,
        stderr: undefined,
        stdout: undefined,
        syscall: undefined,
        name: 'Error',
        errno: undefined,
        device: undefined
      })
    })

    it('should convert an error with a report value', function () {
      const error = new Error('My error')
      error.report = true

      m.chai.expect(errors.toJSON(error)).to.deep.equal({
        code: undefined,
        description: undefined,
        message: 'My error',
        stack: error.stack,
        report: true,
        stderr: undefined,
        stdout: undefined,
        syscall: undefined,
        name: 'Error',
        errno: undefined,
        device: undefined
      })
    })

    it('should convert an error without a message', function () {
      const error = new Error()

      m.chai.expect(errors.toJSON(error)).to.deep.equal({
        code: undefined,
        description: undefined,
        message: '',
        stack: error.stack,
        report: undefined,
        stderr: undefined,
        stdout: undefined,
        syscall: undefined,
        name: 'Error',
        errno: undefined,
        device: undefined
      })
    })
  })

  describe('.fromJSON()', function () {
    it('should return an Error object', function () {
      const error = new Error('My error')
      const result = errors.fromJSON(errors.toJSON(error))
      m.chai.expect(result).to.be.an.instanceof(Error)
    })

    it('should convert a simple JSON error', function () {
      const error = new Error('My error')
      const result = errors.fromJSON(errors.toJSON(error))

      m.chai.expect(result.message).to.equal(error.message)
      m.chai.expect(result.description).to.equal(error.description)
      m.chai.expect(result.code).to.equal(error.code)
      m.chai.expect(result.stack).to.equal(error.stack)
      m.chai.expect(result.report).to.equal(error.report)
    })

    it('should convert a JSON error with a description', function () {
      const error = new Error('My error')
      error.description = 'My description'
      const result = errors.fromJSON(errors.toJSON(error))

      m.chai.expect(result.message).to.equal(error.message)
      m.chai.expect(result.description).to.equal(error.description)
      m.chai.expect(result.code).to.equal(error.code)
      m.chai.expect(result.stack).to.equal(error.stack)
      m.chai.expect(result.report).to.equal(error.report)
    })

    it('should convert a JSON error with a code', function () {
      const error = new Error('My error')
      error.code = 'ENOENT'
      const result = errors.fromJSON(errors.toJSON(error))

      m.chai.expect(result.message).to.equal(error.message)
      m.chai.expect(result.description).to.equal(error.description)
      m.chai.expect(result.code).to.equal(error.code)
      m.chai.expect(result.stack).to.equal(error.stack)
      m.chai.expect(result.report).to.equal(error.report)
    })

    it('should convert a JSON error with a report value', function () {
      const error = new Error('My error')
      error.report = false
      const result = errors.fromJSON(errors.toJSON(error))

      m.chai.expect(result.message).to.equal(error.message)
      m.chai.expect(result.description).to.equal(error.description)
      m.chai.expect(result.code).to.equal(error.code)
      m.chai.expect(result.stack).to.equal(error.stack)
      m.chai.expect(result.report).to.equal(error.report)
    })
  })
})
