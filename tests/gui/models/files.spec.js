/*
 * Copyright 2018 balena.io
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
const files = require('../../../lib/gui/app/models/files')

describe('Shared: Files', function () {
  describe('.splitPath()', function () {
    it('should handle a root directory', function () {
      const { root } = path.parse(__dirname)
      const dirs = files.splitPath(root)
      m.chai.expect(dirs).to.deep.equal([ root ])
    })

    it('should handle relative paths', function () {
      const dirs = files.splitPath(path.join('relative', 'dir', 'test'))
      m.chai.expect(dirs).to.deep.equal([ 'relative', 'dir', 'test' ])
    })

    it('should handle absolute paths', function () {
      let dir
      if (process.platform === 'win32') {
        dir = 'C:\\Users\\user\\Downloads'
        const dirs = files.splitPath(dir)
        m.chai.expect(dirs).to.deep.equal([ 'C:\\', 'Users', 'user', 'Downloads' ])
      } else {
        dir = '/Users/user/Downloads'
        const dirs = files.splitPath(dir)
        m.chai.expect(dirs).to.deep.equal([ '/', 'Users', 'user', 'Downloads' ])
      }
    })
  })
})
