/*
 * Copyright 2017 balena.io
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
const fileExtensions = require('../../lib/shared/file-extensions')

describe('Shared: fileExtensions', function () {
  describe('.getFileExtensions()', function () {
    _.forEach([

      // No extension
      {
        file: 'path/to/filename',
        extensions: []
      },

      // Type: 'archive'
      {
        file: 'path/to/filename.zip',
        extensions: [ 'zip' ]
      },
      {
        file: 'path/to/filename.etch',
        extensions: [ 'etch' ]
      },

      // Type: 'compressed'
      {
        file: 'path/to/filename.img.gz',
        extensions: [ 'img', 'gz' ]
      },
      {
        file: 'path/to/filename.img.bz2',
        extensions: [ 'img', 'bz2' ]
      },
      {
        file: 'path/to/filename.img.xz',
        extensions: [ 'img', 'xz' ]
      },
      {
        file: 'path/to/filename.img.xz.gz',
        extensions: [ 'img', 'xz', 'gz' ]
      },

      // Type: 'image'
      {
        file: 'path/to/filename.img',
        extensions: [ 'img' ]
      },
      {
        file: 'path/to/filename.iso',
        extensions: [ 'iso' ]
      },
      {
        file: 'path/to/filename.dsk',
        extensions: [ 'dsk' ]
      },
      {
        file: 'path/to/filename.hddimg',
        extensions: [ 'hddimg' ]
      },
      {
        file: 'path/to/filename.raw',
        extensions: [ 'raw' ]
      },
      {
        file: 'path/to/filename.dmg',
        extensions: [ 'dmg' ]
      }

    ], (testCase) => {
      it(`should return ${testCase.extensions} for ${testCase.file}`, function () {
        m.chai.expect(fileExtensions.getFileExtensions(testCase.file)).to.deep.equal(testCase.extensions)
      })
    })

    it('should always return lowercase extensions', function () {
      const filePath = 'foo.IMG.gZ'
      m.chai.expect(fileExtensions.getFileExtensions(filePath)).to.deep.equal([
        'img',
        'gz'
      ])
    })
  })

  describe('.getLastFileExtension()', function () {
    it('should return undefined if the file path has no extension', function () {
      m.chai.expect(fileExtensions.getLastFileExtension('foo')).to.equal(null)
    })

    it('should return the extension if there is only one extension', function () {
      m.chai.expect(fileExtensions.getLastFileExtension('foo.img')).to.equal('img')
    })

    it('should return the last extension if there are two extensions', function () {
      m.chai.expect(fileExtensions.getLastFileExtension('foo.img.gz')).to.equal('gz')
    })

    it('should return the last extension if there are three extensions', function () {
      m.chai.expect(fileExtensions.getLastFileExtension('foo.bar.img.gz')).to.equal('gz')
    })
  })

  describe('.getPenultimateFileExtension()', function () {
    it('should return undefined in the file path has no extension', function () {
      m.chai.expect(fileExtensions.getPenultimateFileExtension('foo')).to.equal(null)
    })

    it('should return undefined if there is only one extension', function () {
      m.chai.expect(fileExtensions.getPenultimateFileExtension('foo.img')).to.equal(null)
    })

    it('should return the penultimate extension if there are two extensions', function () {
      m.chai.expect(fileExtensions.getPenultimateFileExtension('foo.img.gz')).to.equal('img')
    })

    it('should return the penultimate extension if there are three extensions', function () {
      m.chai.expect(fileExtensions.getPenultimateFileExtension('foo.bar.img.gz')).to.equal('img')
    })
  })
})
