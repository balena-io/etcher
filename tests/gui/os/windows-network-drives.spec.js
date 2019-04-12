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

const { readFile } = require('fs')
const os = require('os')
const m = require('mochainon')
const { env } = require('process')
const { promisify } = require('util')

const wnd = require('../../../lib/gui/app/os/windows-network-drives')

const readFileAsync = promisify(readFile)

describe('Network drives on Windows', () => {
  before(async () => {
    this.osPlatformStub = m.sinon.stub(os, 'platform')
    this.osPlatformStub.returns('win32')
    const wmicOutput = await readFileAsync('tests/data/wmic-output.txt', { encoding: 'ucs2' })
    this.outputStub = m.sinon.stub(wnd, 'getWmicNetworkDrivesOutput')
    this.outputStub.resolves(wmicOutput)
    this.oldSystemRoot = env.SystemRoot
    env.SystemRoot = 'C:\\Windows'
  })

  it('should parse network drive mapping on Windows', async () => {
    m.chai.expect(await wnd.replaceWindowsNetworkDriveLetter('Z:\\some-folder\\some-file'))
      .to.equal('\\\\192.168.1.1\\Publicé\\some-folder\\some-file')
  })

  after(() => {
    this.osPlatformStub.restore()
    this.outputStub.restore()
    env.SystemRoot = this.oldSystemRoot
  })
})
