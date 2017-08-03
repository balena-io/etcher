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
const windowProgress = require('../../../lib/gui/os/window-progress')

describe('Browser: WindowProgress', function () {
  describe('windowProgress', function () {
    describe('given a stubbed current window', function () {
      beforeEach(function () {
        this.setProgressBarSpy = m.sinon.spy()

        windowProgress.currentWindow = {
          setProgressBar: this.setProgressBarSpy
        }
      })

      describe('.set()', function () {
        it('should translate 0-100 percentages to 0-1 ranges', function () {
          windowProgress.set(85)
          m.chai.expect(this.setProgressBarSpy).to.have.been.calledWith(0.85)
        })

        it('should set 0 given 0', function () {
          windowProgress.set(0)
          m.chai.expect(this.setProgressBarSpy).to.have.been.calledWith(0)
        })

        it('should set 1 given 100', function () {
          windowProgress.set(100)
          m.chai.expect(this.setProgressBarSpy).to.have.been.calledWith(1)
        })

        it('should throw if given a percentage higher than 100', function () {
          m.chai.expect(function () {
            windowProgress.set(101)
          }).to.throw('Invalid percentage: 101')
        })

        it('should throw if given a percentage less than 0', function () {
          m.chai.expect(function () {
            windowProgress.set(-1)
          }).to.throw('Invalid percentage: -1')
        })
      })

      describe('.clear()', function () {
        it('should set -1', function () {
          windowProgress.clear()
          m.chai.expect(this.setProgressBarSpy).to.have.been.calledWith(-1)
        })
      })
    })
  })
})
