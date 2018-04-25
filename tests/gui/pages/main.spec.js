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
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const supportedFormats = require('../../../lib/shared/supported-formats')
const angular = require('angular')
const flashState = require('../../../lib/shared/models/flash-state')
const availableDrives = require('../../../lib/shared/models/available-drives')
const selectionState = require('../../../lib/shared/models/selection-state')
require('angular-mocks')

// Mock HTML requires by reading from the file-system
// eslint-disable-next-line node/no-deprecated-api
require.extensions['.html'] = (module, filename) => {
  module.exports = fs.readFileSync(filename, {
    encoding: 'utf8'
  })
}

describe('Browser: MainPage', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/app/pages/main/main')
  ))

  describe('MainController', function () {
    let $controller

    beforeEach(angular.mock.inject(function (_$controller_) {
      $controller = _$controller_
    }))

    describe('.shouldDriveStepBeDisabled()', function () {
      it('should return true if there is no drive', function () {
        const controller = $controller('MainController', {
          $scope: {}
        })

        selectionState.clear()

        m.chai.expect(controller.shouldDriveStepBeDisabled()).to.be.true
      })

      it('should return false if there is a drive', function () {
        const controller = $controller('MainController', {
          $scope: {}
        })

        selectionState.selectImage({
          path: 'rpi.img',
          extension: 'img',
          size: {
            original: 99999,
            final: {
              estimation: false,
              value: 99999
            }
          }
        })

        m.chai.expect(controller.shouldDriveStepBeDisabled()).to.be.false
      })
    })

    describe('.shouldFlashStepBeDisabled()', function () {
      it('should return true if there is no selected drive nor image', function () {
        const controller = $controller('MainController', {
          $scope: {}
        })

        selectionState.clear()

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.true
      })

      it('should return true if there is a selected image but no drive', function () {
        const controller = $controller('MainController', {
          $scope: {}
        })

        selectionState.clear()
        selectionState.selectImage({
          path: 'rpi.img',
          extension: 'img',
          size: {
            original: 99999,
            final: {
              estimation: false,
              value: 99999
            }
          }
        })

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.true
      })

      it('should return true if there is a selected drive but no image', function () {
        const controller = $controller('MainController', {
          $scope: {}
        })

        availableDrives.setDrives([
          {
            device: '/dev/disk2',
            description: 'Foo',
            size: 99999,
            mountpoint: '/mnt/foo',
            system: false
          }
        ])

        selectionState.clear()
        selectionState.selectDrive('/dev/disk2')

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.true
      })

      it('should return false if there is a selected drive and a selected image', function () {
        const controller = $controller('MainController', {
          $scope: {}
        })

        availableDrives.setDrives([
          {
            device: '/dev/disk2',
            description: 'Foo',
            size: 99999,
            mountpoint: '/mnt/foo',
            system: false
          }
        ])

        selectionState.clear()
        selectionState.selectDrive('/dev/disk2')

        selectionState.selectImage({
          path: 'rpi.img',
          extension: 'img',
          size: {
            original: 99999,
            final: {
              estimation: false,
              value: 99999
            }
          }
        })

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.false
      })
    })
  })

  describe('ImageSelectionController', function () {
    let $controller

    beforeEach(angular.mock.inject(function (_$controller_) {
      $controller = _$controller_
    }))

    it('should contain all available extensions in mainSupportedExtensions and extraSupportedExtensions', function () {
      const $scope = {}
      const controller = $controller('ImageSelectionController', {
        $scope
      })

      const extensions = controller.mainSupportedExtensions.concat(controller.extraSupportedExtensions)
      m.chai.expect(_.sortBy(extensions)).to.deep.equal(_.sortBy(supportedFormats.getAllExtensions()))
    })

    describe('.getImageBasename()', function () {
      it('should return the basename of the selected image', function () {
        const controller = $controller('ImageSelectionController', {
          $scope: {}
        })

        selectionState.selectImage({
          path: path.join(__dirname, 'foo', 'bar.img'),
          extension: 'img',
          size: {
            original: 999999999,
            final: {
              estimation: false,
              value: 999999999
            }
          }
        })

        m.chai.expect(controller.getImageBasename()).to.equal('bar.img')
        selectionState.deselectImage()
      })

      it('should return an empty string if no selected image', function () {
        const controller = $controller('ImageSelectionController', {
          $scope: {}
        })

        selectionState.deselectImage()
        m.chai.expect(controller.getImageBasename()).to.equal('')
      })
    })
  })

  describe('FlashController', function () {
    let $controller

    beforeEach(angular.mock.inject(function (_$controller_) {
      $controller = _$controller_
    }))

    describe('.getProgressButtonLabel()', function () {
      it('should return "Flash!" given a clean state', function () {
        const controller = $controller('FlashController', {
          $scope: {}
        })

        flashState.resetState()
        m.chai.expect(controller.getProgressButtonLabel()).to.equal('Flash!')
      })

      it('should display the flashing progress', function () {
        const controller = $controller('FlashController', {
          $scope: {}
        })

        flashState.setFlashingFlag()
        flashState.setProgressState({
          flashing: 1,
          verifying: 0,
          successful: 0,
          failed: 0,
          percentage: 85,
          eta: 15,
          speed: 1000,
          totalSpeed: 2000
        })
        m.chai.expect(controller.getProgressButtonLabel()).to.equal('85% Flashing')
      })
    })
  })

  describe('DriveSelectionController', function () {
    let $controller
    let DriveSelectionController

    const drivePaths = process.platform === 'win32'
      ? [ '\\\\.\\PhysicalDrive1', '\\\\.\\PhysicalDrive2', '\\\\.\\PhysicalDrive3' ]
      : [ '/dev/disk1', '/dev/disk2', '/dev/disk3' ]
    const drives = [
      {
        device: drivePaths[0],
        description: 'My Drive',
        size: 123456789,
        displayName: drivePaths[0],
        mountpoints: [ drivePaths[0] ],
        isSystem: false,
        isReadOnly: false
      },
      {
        device: drivePaths[1],
        description: 'My Other Drive',
        size: 987654321,
        displayName: drivePaths[1],
        mountpoints: [ drivePaths[1] ],
        isSystem: false,
        isReadOnly: false
      },
      {
        device: drivePaths[2],
        size: 987654321,
        displayName: drivePaths[2],
        mountpoints: [],
        isSystem: false,
        isReadOnly: false
      }
    ]

    beforeEach(angular.mock.inject(function (_$controller_) {
      $controller = _$controller_
      DriveSelectionController = $controller('DriveSelectionController', {
        $scope: {}
      })

      availableDrives.setDrives(drives)
    }))

    afterEach(() => {
      selectionState.clear()
    })

    describe('.getDrivesTitle()', function () {
      it('should return the drive description when there is one drive', function () {
        selectionState.selectDrive(drives[0].device)
        m.chai.expect(DriveSelectionController.getDrivesTitle()).to.equal(drives[0].description)
      })

      it('should return untitled when there is no description', function () {
        selectionState.selectDrive(drives[2].device)
        m.chai.expect(DriveSelectionController.getDrivesTitle()).to.equal('Untitled Device')
      })

      it('should return a consolidated title with quantity when there are multiple drives', function () {
        selectionState.selectDrive(drives[0].device)
        selectionState.selectDrive(drives[1].device)
        m.chai.expect(DriveSelectionController.getDrivesTitle()).to.equal('2 Devices')
      })
    })

    describe('.getDriveListLabel()', function () {
      it('should return the drive description and display name when there is one drive', function () {
        const label = `${drives[0].description} (${drives[0].displayName})`
        selectionState.selectDrive(drives[0].device)
        m.chai.expect(DriveSelectionController.getDriveListLabel()).to.equal(label)
      })

      it('should return drive descriptions and display names of all drives separated by newlines', function () {
        const label = `${drives[0].description} (${drives[0].displayName})\n${drives[1].description} (${drives[1].displayName})`
        selectionState.selectDrive(drives[0].device)
        selectionState.selectDrive(drives[1].device)
        m.chai.expect(DriveSelectionController.getDriveListLabel()).to.equal(label)
      })
    })
  })

  describe('page template', function () {
    let $state

    beforeEach(angular.mock.inject(function (_$state_) {
      $state = _$state_
    }))

    it('should match the file contents', function () {
      const {
        template
      } = $state.get('main')
      const contents = fs.readFileSync('lib/gui/app/pages/main/templates/main.tpl.html', {
        encoding: 'utf-8'
      })
      m.chai.expect(template).to.equal(contents)
    })
  })
})
