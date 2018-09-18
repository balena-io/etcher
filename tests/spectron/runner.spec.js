/*
 * Copyright 2017 resin.io
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

const Bluebird = require('bluebird')
const spectron = require('spectron')
const m = require('mochainon')
const EXIT_CODES = require('../../lib/shared/exit-codes')
const entrypoint = process.env.ETCHER_SPECTRON_ENTRYPOINT

if (!entrypoint) {
  console.error('You need to properly configure ETCHER_SPECTRON_ENTRYPOINT')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

describe('Spectron', function () {
  // Mainly for CI jobs
  this.timeout(20000)

  let app = null

  before('app:start', function () {
    app = new spectron.Application({
      path: entrypoint,
      port: 9999,
      args: [ '.' ]
    })

    return app.start()
  })

  after('app:stop', function () {
    if (app && app.isRunning()) {
      return app.stop()
    }

    return Bluebird.resolve()
  })

  after('app:deref', function () {
    app = null
  })

  describe('Browser Window', function () {
    it('should open a browser window', function () {
      return app.browserWindow.isVisible().then((isVisible) => {
        m.chai.expect(isVisible).to.be.true
      })
    })

    it('should set a proper title', function () {
      return app.client.getTitle().then((title) => {
        m.chai.expect(title).to.equal('Etcher')
      })
    })
  })
})
