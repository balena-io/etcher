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
const os = require('os')
const drivelist = require('drivelist')
const driveScanner = require('../../../lib/gui/modules/drive-scanner')

describe('Browser: driveScanner', function () {
  describe('detected devices should be an array', function () {
    it('should emit an empty array', function (done) {
      const spy = m.sinon.spy()

      driveScanner.once('devices', function (drives) {
        m.chai.expect(drives).to.be.an.instanceof(Array)
        m.chai.expect(spy).to.not.have.been.called
        driveScanner.removeListener('error', spy)
        driveScanner.stop()
        done()
      })

      driveScanner.on('error', spy)
      driveScanner.start()
    })
  })

  describe('given only system available drives', function () {
    beforeEach(function () {
      this.drivelistStub = m.sinon.stub(drivelist, 'list')
      this.drivelistStub.yields(null, [
        {
          device: '/dev/sda',
          description: 'WDC WD10JPVX-75J',
          size: '931.5G',
          mountpoints: [
            {
              path: '/'
            }
          ],
          system: true
        }
      ])
    })

    afterEach(function () {
      this.drivelistStub.restore()
    })

    it('should emit an empty array', function (done) {
      const spy = m.sinon.spy()

      driveScanner.once('devices', function (drives) {
        m.chai.expect(drives).to.deep.equal([])
        m.chai.expect(spy).to.not.have.been.called
        driveScanner.removeListener('error', spy)
        driveScanner.stop()
        done()
      })

      driveScanner.on('error', spy)
      driveScanner.start()
    })
  })

  describe('given linux', function () {
    beforeEach(function () {
      this.osPlatformStub = m.sinon.stub(os, 'platform')
      this.osPlatformStub.returns('linux')
    })

    afterEach(function () {
      this.osPlatformStub.restore()
    })

    describe('given available drives', function () {
      beforeEach(function () {
        this.drivelistStub = m.sinon.stub(drivelist, 'list')
        this.drivelistStub.yields(null, [
          {
            device: '/dev/sda',
            displayName: '/dev/sda',
            description: 'WDC WD10JPVX-75J',
            size: '931.5G',
            mountpoints: [
              {
                path: '/'
              }
            ],
            system: true
          },
          {
            device: '/dev/sdb',
            displayName: '/dev/sdb',
            description: 'Foo',
            size: '14G',
            mountpoints: [
              {
                path: '/mnt/foo'
              }
            ],
            system: false
          },
          {
            device: '/dev/sdc',
            displayName: '/dev/sdc',
            description: 'Bar',
            size: '14G',
            mountpoints: [
              {
                path: '/mnt/bar'
              }
            ],
            system: false
          }
        ])
      })

      afterEach(function () {
        this.drivelistStub.restore()
      })

      it('should emit the non removable drives', function (done) {
        const spy = m.sinon.spy()

        driveScanner.once('devices', function (drives) {
          m.chai.expect(drives).to.deep.equal([
            {
              device: '/dev/sdb',
              displayName: '/dev/sdb',
              description: 'Foo',
              size: '14G',
              mountpoints: [
                {
                  path: '/mnt/foo'
                }
              ],
              adapter: 'standard',
              system: false
            },
            {
              device: '/dev/sdc',
              displayName: '/dev/sdc',
              description: 'Bar',
              size: '14G',
              mountpoints: [
                {
                  path: '/mnt/bar'
                }
              ],
              adapter: 'standard',
              system: false
            }
          ])

          m.chai.expect(spy).to.not.have.been.called
          driveScanner.removeListener('error', spy)
          driveScanner.stop()
          done()
        })

        driveScanner.on('error', spy)
        driveScanner.start()
      })
    })
  })

  describe('given windows', function () {
    beforeEach(function () {
      this.osPlatformStub = m.sinon.stub(os, 'platform')
      this.osPlatformStub.returns('win32')
    })

    afterEach(function () {
      this.osPlatformStub.restore()
    })

    describe('given available drives', function () {
      beforeEach(function () {
        this.drivelistStub = m.sinon.stub(drivelist, 'list')
        this.drivelistStub.yields(null, [
          {
            device: '\\\\.\\PHYSICALDRIVE1',
            displayName: 'C:',
            description: 'WDC WD10JPVX-75J',
            size: '931.5G',
            mountpoints: [
              {
                path: 'C:'
              }
            ],
            system: true
          },
          {
            device: '\\\\.\\PHYSICALDRIVE2',
            displayName: '\\\\.\\PHYSICALDRIVE2',
            description: 'Foo',
            size: '14G',
            mountpoints: [],
            system: false
          },
          {
            device: '\\\\.\\PHYSICALDRIVE3',
            displayName: 'F:',
            description: 'Bar',
            size: '14G',
            mountpoints: [
              {
                path: 'F:'
              }
            ],
            system: false
          }
        ])
      })

      afterEach(function () {
        this.drivelistStub.restore()
      })

      it('should emit the non removable drives', function (done) {
        const spy = m.sinon.spy()

        driveScanner.once('devices', function (drives) {
          m.chai.expect(drives).to.deep.equal([
            {
              device: '\\\\.\\PHYSICALDRIVE2',
              displayName: '\\\\.\\PHYSICALDRIVE2',
              description: 'Foo',
              size: '14G',
              mountpoints: [],
              adapter: 'standard',
              system: false
            },
            {
              device: '\\\\.\\PHYSICALDRIVE3',
              displayName: 'F:',
              description: 'Bar',
              size: '14G',
              mountpoints: [
                {
                  path: 'F:'
                }
              ],
              adapter: 'standard',
              system: false
            }
          ])

          m.chai.expect(spy).to.not.have.been.called
          driveScanner.removeListener('error', spy)
          driveScanner.stop()
          done()
        })

        driveScanner.on('error', spy)
        driveScanner.start()
      })
    })

    describe('given a drive with a single drive letters', function () {
      beforeEach(function () {
        this.drivelistStub = m.sinon.stub(drivelist, 'list')
        this.drivelistStub.yields(null, [
          {
            device: '\\\\.\\PHYSICALDRIVE3',
            displayName: 'F:',
            description: 'Bar',
            size: '14G',
            mountpoints: [
              {
                path: 'F:'
              }
            ],
            system: false
          }
        ])
      })

      afterEach(function () {
        this.drivelistStub.restore()
      })

      it('should use the drive letter as the name', function (done) {
        const spy = m.sinon.spy()

        driveScanner.once('devices', function (drives) {
          m.chai.expect(drives).to.have.length(1)
          m.chai.expect(drives[0].displayName).to.equal('F:')
          m.chai.expect(spy).to.not.have.been.called
          driveScanner.removeListener('error', spy)
          driveScanner.stop()
          done()
        })

        driveScanner.on('error', spy)
        driveScanner.start()
      })
    })

    describe('given a drive with multiple drive letters', function () {
      beforeEach(function () {
        this.drivesListStub = m.sinon.stub(drivelist, 'list')
        this.drivesListStub.yields(null, [
          {
            device: '\\\\.\\PHYSICALDRIVE3',
            displayName: 'F:, G:, H:',
            description: 'Bar',
            size: '14G',
            mountpoints: [
              {
                path: 'F:'
              },
              {
                path: 'G:'
              },
              {
                path: 'H:'
              }
            ],
            system: false
          }
        ])
      })

      afterEach(function () {
        this.drivesListStub.restore()
      })

      it('should join all the mountpoints in `name`', function (done) {
        const spy = m.sinon.spy()

        driveScanner.once('devices', function (drives) {
          m.chai.expect(drives).to.have.length(1)
          m.chai.expect(drives[0].displayName).to.equal('F:, G:, H:')
          m.chai.expect(spy).to.not.have.been.called
          driveScanner.removeListener('error', spy)
          driveScanner.stop()
          done()
        })

        driveScanner.on('error', spy)
        driveScanner.start()
      })
    })
  })

  describe('given an error when listing the drives', function () {
    beforeEach(function () {
      this.drivesListStub = m.sinon.stub(drivelist, 'list')
      this.drivesListStub.yields(new Error('scan error'))
    })

    afterEach(function () {
      this.drivesListStub.restore()
    })

    it('should emit the error', function (done) {
      driveScanner.once('error', function (error) {
        m.chai.expect(error).to.be.an.instanceof(Error)
        m.chai.expect(error.message).to.equal('scan error')
        driveScanner.stop()
        done()
      })

      driveScanner.start()
    })
  })
})
