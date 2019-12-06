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
const messages = require('../../lib/shared/messages')

describe('Shared: Messages', function () {
  beforeEach(function () {
    this.drives = [
      {
        description: 'My Drive',
        displayName: '/dev/disk1'
      },
      {
        description: 'Other Drive',
        displayName: '/dev/disk2'
      }
    ]
  })

  it('should contain object properties', function () {
    m.chai.expect(_.every(_.map(messages, _.isPlainObject))).to.be.true
  })

  it('should contain function properties in each category', function () {
    _.each(messages, (category) => {
      m.chai.expect(_.every(_.map(category, _.isFunction))).to.be.true
    })
  })

  describe('.info', function () {
    describe('.flashComplete()', function () {
      it('should use singular when there are single results', function () {
        const msg = messages.info.flashComplete('image.img', this.drives, {
          failed: 1,
          successful: 1
        })

        m.chai.expect(msg).to.equal('image.img was successfully flashed to 1 target and failed to be flashed to 1 target')
      })

      it('should use plural when there are multiple results', function () {
        const msg = messages.info.flashComplete('image.img', this.drives, {
          failed: 2,
          successful: 2
        })

        m.chai.expect(msg).to.equal('image.img was successfully flashed to 2 targets and failed to be flashed to 2 targets')
      })

      it('should not contain failed target part when there are none', function () {
        const msg = messages.info.flashComplete('image.img', this.drives, {
          failed: 0,
          successful: 2
        })

        m.chai.expect(msg).to.equal('image.img was successfully flashed to 2 targets')
      })

      it('should show drive name and description when only target', function () {
        const msg = messages.info.flashComplete('image.img', this.drives, {
          failed: 0,
          successful: 1
        })

        m.chai.expect(msg).to.equal('image.img was successfully flashed to My Drive (/dev/disk1)')
      })
    })
  })

  describe('.error', function () {
    describe('.flashFailure()', function () {
      it('should use plural when there are multiple drives', function () {
        const msg = messages.error.flashFailure('image.img', this.drives)

        m.chai.expect(msg).to.equal('Something went wrong while writing image.img to 2 targets.')
      })

      it('should use singular when there is one drive', function () {
        const msg = messages.error.flashFailure('image.img', [ this.drives[0] ])

        m.chai.expect(msg).to.equal('Something went wrong while writing image.img to My Drive (/dev/disk1).')
      })
    })
  })
})
