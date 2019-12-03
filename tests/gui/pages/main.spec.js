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
const angular = require('angular')
const availableDrives = require('../../../lib/gui/app/models/available-drives')
const selectionState = require('../../../lib/gui/app/models/selection-state')

// Mock HTML requires by reading from the file-system
// eslint-disable-next-line node/no-deprecated-api
require.extensions['.html'] = (module, filename) => {
  module.exports = fs.readFileSync(filename, {
    encoding: 'utf8'
  })
}

// NOTE(Shou): since we don't test React yet we just ignore JSX files
// eslint-disable-next-line node/no-deprecated-api
require.extensions['.jsx'] = _.constant(null)

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
          $scope: {
            $apply: _.noop
          }
        })

        selectionState.clear()

        m.chai.expect(controller.shouldDriveStepBeDisabled()).to.be.true
      })

      it('should return false if there is a drive', function () {
        const controller = $controller('MainController', {
          $scope: {
            $apply: _.noop
          }
        })

        selectionState.selectImage({
          path: 'rpi.img',
          extension: 'img',
          size: 99999,
          isSizeEstimated: false
        })

        m.chai.expect(controller.shouldDriveStepBeDisabled()).to.be.false
      })
    })

    describe('.shouldFlashStepBeDisabled()', function () {
      it('should return true if there is no selected drive nor image', function () {
        const controller = $controller('MainController', {
          $scope: {
            $apply: _.noop
          }
        })

        selectionState.clear()

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.true
      })

      it('should return true if there is a selected image but no drive', function () {
        const controller = $controller('MainController', {
          $scope: {
            $apply: _.noop
          }
        })

        selectionState.clear()
        selectionState.selectImage({
          path: 'rpi.img',
          extension: 'img',
          size: 99999,
          isSizeEstimated: false
        })

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.true
      })

      it('should return true if there is a selected drive but no image', function () {
        const controller = $controller('MainController', {
          $scope: {
            $apply: _.noop
          }
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
          $scope: {
            $apply: _.noop
          }
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
          size: 99999,
          isSizeEstimated: false
        })

        m.chai.expect(controller.shouldFlashStepBeDisabled()).to.be.false
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
