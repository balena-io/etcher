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
const Bluebird = require('bluebird')
const fs = Bluebird.promisifyAll(require('fs'))
const os = require('os')
const path = require('path')
const imageStream = require('../../lib/sdk/image-stream/index')

const doFilesContainTheSameData = (file1, file2) => {
  return Bluebird.props({
    file1: fs.readFileAsync(file1),
    file2: fs.readFileAsync(file2)
  }).then(function (data) {
    return _.isEqual(data.file1, data.file2)
  })
}

exports.DEFAULT_IMAGE_TESTS_TIMEOUT = 20000

exports.expectError = function (file, errorMessage, errorDetail) {
  it('should be rejected with an error', function () {
    return imageStream.getFromFilePath(file).catch((error) => {
      m.chai.expect(error).to.be.an.instanceof(Error)
      m.chai.expect(error.message).to.equal(errorMessage)
      if (errorDetail) {
        m.chai.expect(error.description).to.contain(errorDetail)
        m.chai.expect(error.description).to.be.a.string
        m.chai.expect(error.description.length > 0).to.be.true
      }
    })
  })
}

exports.extractFromFilePath = function (file, image) {
  it('should be able to extract the image', function () {
    const output = path.join(os.tmpdir(), path.basename(file))

    return imageStream.getFromFilePath(file).then(function (results) {
      m.chai.expect(results.path).to.equal(file)
      m.chai.expect(_.isString(results.extension)).to.be.true
      m.chai.expect(_.isEmpty(_.trim(results.extension))).to.be.false

      if (!_.some([
        results.size.original === fs.statSync(file).size,
        results.size.original === fs.statSync(image).size
      ])) {
        throw new Error(`Invalid size: ${results.size.original}`)
      }

      const stream = results.stream
        .pipe(results.transform)
        .pipe(fs.createWriteStream(output))

      return new Bluebird((resolve, reject) => {
        stream.on('error', reject)
        stream.on('close', resolve)
      })
    }).then(function () {
      return doFilesContainTheSameData(image, output)
    }).then(function (areEqual) {
      m.chai.expect(areEqual).to.be.true
    }).finally(function () {
      return fs.unlinkAsync(output)
        .catch({ code: 'ENOENT' }, _.noop)
    })
  })
}
