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
const ipc = require('node-ipc')
// eslint-disable-next-line node/no-missing-require
require('../../../lib/gui/modules/child-writer')

describe('Browser: childWriter', function () {
  it('should have the ipc config set to silent', function () {
    m.chai.expect(ipc.config.silent).to.be.true
  })
})
