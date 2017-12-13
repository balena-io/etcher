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

const m = require('mochainon')

module.exports = () => {
  describe('Browser Window', function () {
    it('should set a proper title', function () {
      return this.app.client.getTitle().then((title) => {
        m.chai.expect(title).to.equal('Etcher')
      })
    })

    it('should open a browser window', function () {
      return this.app.browserWindow.isVisible().then((isVisible) => {
        m.chai.expect(isVisible).to.be.true
      })
    })
  })
}
