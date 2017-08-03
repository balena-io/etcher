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

'use strict'

const m = require('mochainon')
const _ = require('lodash')
const imageStream = require('../../lib/image-stream/index')

describe('ImageStream', function () {
  describe('.supportedFileTypes', function () {
    it('should be an array', function () {
      m.chai.expect(_.isArray(imageStream.supportedFileTypes)).to.be.true
    })

    it('should not be empty', function () {
      m.chai.expect(_.isEmpty(imageStream.supportedFileTypes)).to.be.false
    })

    it('should contain only strings', function () {
      m.chai.expect(_.every(_.map(imageStream.supportedFileTypes, function (fileType) {
        return _.isString(fileType.extension) && _.isString(fileType.type)
      }))).to.be.true
    })

    it('should not contain empty strings', function () {
      m.chai.expect(_.every(_.map(imageStream.supportedFileTypes, function (fileType) {
        return !_.isEmpty(fileType.extension) && !_.isEmpty(fileType.type)
      }))).to.be.true
    })

    it('should not contain a leading period in any file type extension', function () {
      m.chai.expect(_.every(_.map(imageStream.supportedFileTypes, function (fileType) {
        return _.first(fileType.extension) !== '.'
      }))).to.be.true
    })
  })
})
