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
