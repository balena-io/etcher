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
// eslint-disable-next-line node/no-missing-require
const windowProgress = require('../../../lib/gui/app/os/window-progress')

describe('Browser: WindowProgress', function () {
  describe('windowProgress', function () {
    describe('given a stubbed current window', function () {
      beforeEach(function () {
        this.setProgressBarSpy = m.sinon.spy()
        this.setTitleSpy = m.sinon.spy()

        windowProgress.currentWindow = {
          setProgressBar: this.setProgressBarSpy,
          setTitle: this.setTitleSpy
        }

        this.state = {
          flashing: 1,
          verifying: 0,
          successful: 0,
          failed: 0,
          percentage: 85,
          speed: 100
        }
      })

      describe('.set()', function () {
        it('should translate 0-100 percentages to 0-1 ranges', function () {
          windowProgress.set(this.state)
          m.chai.expect(this.setProgressBarSpy).to.have.been.calledWith(0.85)
        })

        it('should set 0 given 0', function () {
          this.state.percentage = 0
          windowProgress.set(this.state)
          m.chai.expect(this.setProgressBarSpy).to.have.been.calledWith(0)
        })

        it('should set 1 given 100', function () {
          this.state.percentage = 100
          windowProgress.set(this.state)
          m.chai.expect(this.setProgressBarSpy).to.have.been.calledWith(1)
        })

        it('should throw if given a percentage higher than 100', function () {
          this.state.percentage = 101
          const state = this.state
          m.chai.expect(function () {
            windowProgress.set(state)
          }).to.throw('Invalid percentage: 101')
        })

        it('should throw if given a percentage less than 0', function () {
          this.state.percentage = -1
          const state = this.state
          m.chai.expect(function () {
            windowProgress.set(state)
          }).to.throw('Invalid percentage: -1')
        })

        it('should set the flashing title', function () {
          windowProgress.set(this.state)
          m.chai.expect(this.setTitleSpy).to.have.been.calledWith(' \u2013 85% Flashing')
        })

        it('should set the verifying title', function () {
          this.state.flashing = 0
          this.state.verifying = 1
          windowProgress.set(this.state)
          m.chai.expect(this.setTitleSpy).to.have.been.calledWith(' \u2013 85% Validating')
        })

        it('should set the starting title', function () {
          this.state.percentage = 0
          this.state.speed = 0
          windowProgress.set(this.state)
          m.chai.expect(this.setTitleSpy).to.have.been.calledWith(' \u2013 Starting...')
        })

        it('should set the finishing title', function () {
          this.state.percentage = 100
          windowProgress.set(this.state)
          m.chai.expect(this.setTitleSpy).to.have.been.calledWith(' \u2013 Finishing...')
        })
      })

      describe('.clear()', function () {
        it('should set -1', function () {
          windowProgress.clear()
          m.chai.expect(this.setProgressBarSpy).to.have.been.calledWith(-1)
        })

        it('should clear the window title', function () {
          windowProgress.clear()
          m.chai.expect(this.setTitleSpy).to.have.been.calledWith('')
        })
      })
    })
  })
})
