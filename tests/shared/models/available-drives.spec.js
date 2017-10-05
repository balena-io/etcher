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
const path = require('path')
const availableDrives = require('../../../lib/shared/models/available-drives')
const selectionState = require('../../../lib/shared/models/selection-state')

describe('Model: availableDrives', function () {
  describe('availableDrives', function () {
    it('should have no drives by default', function () {
      m.chai.expect(availableDrives.getDrives()).to.deep.equal([])
    })

    describe('.setDrives()', function () {
      it('should throw if no drives', function () {
        m.chai.expect(function () {
          availableDrives.setDrives()
        }).to.throw('Missing drives')
      })

      it('should throw if drives is not an array', function () {
        m.chai.expect(function () {
          availableDrives.setDrives(123)
        }).to.throw('Invalid drives: 123')
      })

      it('should throw if drives is not an array of objects', function () {
        m.chai.expect(function () {
          availableDrives.setDrives([
            123,
            123,
            123
          ])
        }).to.throw('Invalid drives: 123,123,123')
      })
    })

    describe('given no drives', function () {
      describe('.hasAvailableDrives()', function () {
        it('should return false', function () {
          m.chai.expect(availableDrives.hasAvailableDrives()).to.be.false
        })
      })

      describe('.setDrives()', function () {
        it('should be able to set drives', function () {
          const drives = [
            {
              device: '/dev/sdb',
              description: 'Foo',
              size: '14G',
              mountpoint: '/mnt/foo',
              system: false
            }
          ]

          availableDrives.setDrives(drives)
          m.chai.expect(availableDrives.getDrives()).to.deep.equal(drives)
        })

        it('should be able to set non-plain drive objects', function () {
          class Device {
            constructor () {
              this.device = '/dev/sdb'
              this.description = 'Foo'
              this.mountpoint = '/mnt/foo'
              this.system = false
            }
          }

          availableDrives.setDrives([ new Device() ])
          m.chai.expect(availableDrives.getDrives()).to.deep.equal([
            {
              device: '/dev/sdb',
              description: 'Foo',
              mountpoint: '/mnt/foo',
              system: false
            }
          ])
        })

        it('should be able to set drives with extra properties', function () {
          const drives = [
            {
              device: '/dev/sdb',
              description: 'Foo',
              size: '14G',
              mountpoint: '/mnt/foo',
              system: false,
              foo: {
                bar: 'baz',
                qux: 5
              },
              set: new Set()
            }
          ]

          availableDrives.setDrives(drives)
          m.chai.expect(availableDrives.getDrives()).to.deep.equal(drives)
        })

        it('should be able to set drives with null sizes', function () {
          const drives = [
            {
              device: '/dev/sdb',
              description: 'Foo',
              size: null,
              mountpoint: '/mnt/foo',
              system: false
            }
          ]

          availableDrives.setDrives(drives)
          m.chai.expect(availableDrives.getDrives()).to.deep.equal(drives)
        })

        describe('given no selected image and no selected drive', function () {
          beforeEach(function () {
            selectionState.removeDrive()
            selectionState.removeImage()
          })

          it('should auto-select a single valid available drive', function () {
            m.chai.expect(selectionState.hasDrive()).to.be.false

            availableDrives.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 999999999,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              }
            ])

            m.chai.expect(selectionState.hasDrive()).to.be.true
            m.chai.expect(selectionState.getDrive().device).to.equal('/dev/sdb')
          })
        })

        describe('given a selected image and no selected drive', function () {
          beforeEach(function () {
            if (process.platform === 'win32') {
              this.imagePath = 'E:\\bar\\foo.img'
            } else {
              this.imagePath = '/mnt/bar/foo.img'
            }

            selectionState.removeDrive()
            selectionState.setImage({
              path: this.imagePath,
              extension: 'img',
              size: {
                original: 999999999,
                final: {
                  estimation: false,
                  value: 999999999
                }
              },
              recommendedDriveSize: 2000000000
            })
          })

          afterEach(function () {
            selectionState.removeImage()
          })

          it('should not auto-select when there are multiple valid available drives', function () {
            m.chai.expect(selectionState.hasDrive()).to.be.false

            availableDrives.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 999999999,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              },
              {
                device: '/dev/sdc',
                name: 'Bar',
                size: 999999999,
                mountpoint: '/mnt/bar',
                system: false,
                protected: false
              }
            ])

            m.chai.expect(selectionState.hasDrive()).to.be.false
          })

          it('should auto-select a single valid available drive', function () {
            m.chai.expect(selectionState.hasDrive()).to.be.false

            availableDrives.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 2000000000,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              }
            ])

            m.chai.expect(selectionState.getDrive()).to.deep.equal({
              device: '/dev/sdb',
              name: 'Foo',
              size: 2000000000,
              mountpoint: '/mnt/foo',
              system: false,
              protected: false
            })
          })

          it('should not auto-select a single too small drive', function () {
            m.chai.expect(selectionState.hasDrive()).to.be.false

            availableDrives.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 99999999,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              }
            ])

            m.chai.expect(selectionState.hasDrive()).to.be.false
          })

          it('should not auto-select a single drive that doesn\'t meet the recommended size', function () {
            m.chai.expect(selectionState.hasDrive()).to.be.false

            availableDrives.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 1500000000,
                mountpoint: '/mnt/foo',
                system: false,
                protected: false
              }
            ])

            m.chai.expect(selectionState.hasDrive()).to.be.false
          })

          it('should not auto-select a single protected drive', function () {
            m.chai.expect(selectionState.hasDrive()).to.be.false

            availableDrives.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 2000000000,
                mountpoint: '/mnt/foo',
                system: false,
                protected: true
              }
            ])

            m.chai.expect(selectionState.hasDrive()).to.be.false
          })

          it('should not auto-select a source drive', function () {
            m.chai.expect(selectionState.hasDrive()).to.be.false

            availableDrives.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 2000000000,
                mountpoints: [
                  {
                    path: path.dirname(this.imagePath)
                  }
                ],
                system: false,
                protected: false
              }
            ])

            m.chai.expect(selectionState.hasDrive()).to.be.false
          })

          it('should not auto-select a single system drive', function () {
            m.chai.expect(selectionState.hasDrive()).to.be.false

            availableDrives.setDrives([
              {
                device: '/dev/sdb',
                name: 'Foo',
                size: 2000000000,
                mountpoint: '/mnt/foo',
                system: true,
                protected: false
              }
            ])

            m.chai.expect(selectionState.hasDrive()).to.be.false
          })
        })
      })
    })

    describe('given drives', function () {
      beforeEach(function () {
        this.drives = [
          {
            device: '/dev/sdb',
            name: 'SD Card',
            size: 9999999,
            mountpoint: '/mnt/foo',
            system: false,
            protected: false
          },
          {
            device: '/dev/sdc',
            name: 'USB Drive',
            size: 9999999,
            mountpoint: '/mnt/bar',
            system: false,
            protected: false
          }
        ]

        availableDrives.setDrives(this.drives)
      })

      describe('given one of the drives was selected', function () {
        beforeEach(function () {
          availableDrives.setDrives([
            {
              device: '/dev/sdc',
              name: 'USB Drive',
              size: 9999999,
              mountpoint: '/mnt/bar',
              system: false,
              protected: false
            }
          ])

          selectionState.setDrive('/dev/sdc')
        })

        afterEach(function () {
          selectionState.removeDrive()
        })

        it('should be deleted if its not contained in the available drives anymore', function () {
          m.chai.expect(selectionState.hasDrive()).to.be.true

          // We have to provide at least two drives, otherwise,
          // if we only provide one, the single drive will be
          // auto-selected.
          availableDrives.setDrives([
            {
              device: '/dev/sda',
              name: 'USB Drive',
              size: 9999999,
              mountpoint: '/mnt/bar',
              system: false,
              protected: false
            },
            {
              device: '/dev/sdb',
              name: 'SD Card',
              size: 9999999,
              mountpoint: '/mnt/foo',
              system: false,
              protected: false
            }
          ])

          m.chai.expect(selectionState.hasDrive()).to.be.false
        })
      })

      describe('.hasAvailableDrives()', function () {
        it('should return true', function () {
          const hasDrives = availableDrives.hasAvailableDrives()
          m.chai.expect(hasDrives).to.be.true
        })
      })

      describe('.setDrives()', function () {
        it('should keep the same drives if equal', function () {
          availableDrives.setDrives(this.drives)
          m.chai.expect(availableDrives.getDrives()).to.deep.equal(this.drives)
        })

        it('should return empty array given an empty array', function () {
          availableDrives.setDrives([])
          m.chai.expect(availableDrives.getDrives()).to.deep.equal([])
        })

        it('should consider drives with different $$hashKey the same', function () {
          this.drives[0].$$haskey = 1234
          availableDrives.setDrives(this.drives)
          m.chai.expect(availableDrives.getDrives()).to.deep.equal(this.drives)
        })
      })
    })
  })
})
