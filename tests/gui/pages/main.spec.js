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
const path = require('path')
const supportedFormats = require('../../../lib/shared/supported-formats')
const angular = require('angular')
const settings = require('../../../lib/gui/models/settings')
const flashState = require('../../../lib/shared/models/flash-state')
const availableDrives = require('../../../lib/shared/models/available-drives')
const selectionState = require('../../../lib/shared/models/selection-state')
require('angular-mocks')

describe('Browser: MainPage', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/pages/main/main')
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

        selectionState.setImage({
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
        selectionState.setImage({
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
        selectionState.addDrive('/dev/disk2')

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
        selectionState.addDrive('/dev/disk2')

        selectionState.setImage({
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

        console.log(`hasDrive: ${selectionState.hasDrive()}`)
        console.log(`hasImage: ${selectionState.hasImage()}`)

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

        selectionState.setImage({
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
        selectionState.removeImage()
      })

      it('should return an empty string if no selected image', function () {
        const controller = $controller('ImageSelectionController', {
          $scope: {}
        })

        selectionState.removeImage()
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

      describe('given there is a flash in progress', function () {
        beforeEach(function () {
          flashState.setFlashingFlag()
        })

        it('should report 0% if percentage == 0 but speed != 0', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'write',
            percentage: 0,
            eta: 15,
            speed: 100000000000000
          })

          return settings.set('unmountOnSuccess', true).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('0%')
          })
        })

        it('should handle percentage == 0, type = write, unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'write',
            percentage: 0,
            eta: 15,
            speed: 0
          })

          return settings.set('unmountOnSuccess', true).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('Starting...')
          })
        })

        it('should handle percentage == 0, type = write, !unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'write',
            percentage: 0,
            eta: 15,
            speed: 0
          })

          return settings.set('unmountOnSuccess', false).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('Starting...')
          })
        })

        it('should handle percentage == 0, type = check, unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'check',
            percentage: 0,
            eta: 15,
            speed: 0
          })

          return settings.set('unmountOnSuccess', true).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('Starting...')
          })
        })

        it('should handle percentage == 0, type = check, !unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'check',
            percentage: 0,
            eta: 15,
            speed: 0
          })

          return settings.set('unmountOnSuccess', false).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('Starting...')
          })
        })

        it('should handle percentage == 50, type = write, unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15,
            speed: 1000
          })

          return settings.set('unmountOnSuccess', true).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('50%')
          })
        })

        it('should handle percentage == 50, type = write, !unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'write',
            percentage: 50,
            eta: 15,
            speed: 1000
          })

          return settings.set('unmountOnSuccess', false).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('50%')
          })
        })

        it('should handle percentage == 50, type = check, unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'check',
            percentage: 50,
            eta: 15,
            speed: 1000
          })

          return settings.set('unmountOnSuccess', true).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('50% Validating...')
          })
        })

        it('should handle percentage == 50, type = check, !unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'check',
            percentage: 50,
            eta: 15,
            speed: 1000
          })

          return settings.set('unmountOnSuccess', false).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('50% Validating...')
          })
        })

        it('should handle percentage == 100, type = write, unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'write',
            percentage: 100,
            eta: 15,
            speed: 1000
          })

          return settings.set('unmountOnSuccess', true).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('Finishing...')
          })
        })

        it('should handle percentage == 100, type = write, !unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'write',
            percentage: 100,
            eta: 15,
            speed: 1000
          })

          return settings.set('unmountOnSuccess', false).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('Finishing...')
          })
        })

        it('should handle percentage == 100, type = check, unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'check',
            percentage: 100,
            eta: 15,
            speed: 1000
          })

          return settings.set('unmountOnSuccess', true).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('Unmounting...')
          })
        })

        it('should handle percentage == 100, type = check, !unmountOnSuccess', function () {
          const controller = $controller('FlashController', {
            $scope: {}
          })

          flashState.setProgressState({
            type: 'check',
            percentage: 100,
            eta: 15,
            speed: 1000
          })

          return settings.set('unmountOnSuccess', false).then(() => {
            m.chai.expect(controller.getProgressButtonLabel()).to.equal('Finishing...')
          })
        })
      })
    })
  })
})
