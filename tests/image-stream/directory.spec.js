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
const path = require('path')
const DATA_PATH = path.join(__dirname, 'data')
const IMAGES_PATH = path.join(DATA_PATH, 'images')
const errors = require('../../lib/shared/errors')
const imageStream = require('../../lib/image-stream/index')

describe('ImageStream: Directory', function () {
  describe('.getFromFilePath()', function () {
    describe('given a directory', function () {
      it('should be rejected with an error', function (done) {
        imageStream.getFromFilePath(IMAGES_PATH).catch((error) => {
          m.chai.expect(error).to.be.an.instanceof(Error)
          m.chai.expect(errors.getTitle(error)).to.equal('Invalid image')
          m.chai.expect(errors.getDescription(error)).to.equal('The image must be a file')
          m.chai.expect(errors.isUserError(error)).to.be.true
          done()
        })
      })
    })
  })

  describe('.getImageMetadata()', function () {
    it('should be rejected with an error', function (done) {
      imageStream.getImageMetadata(IMAGES_PATH).catch((error) => {
        m.chai.expect(error).to.be.an.instanceof(Error)
        m.chai.expect(errors.getTitle(error)).to.equal('Invalid image')
        m.chai.expect(errors.getDescription(error)).to.equal('The image must be a file')
        m.chai.expect(errors.isUserError(error)).to.be.true
        done()
      })
    })
  })
})
