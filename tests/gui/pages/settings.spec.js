/*
 * Copyright 2018 resin.io
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
const fs = require('fs')
const angular = require('angular')

describe('Browser: SettingsPage', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/app/pages/settings/settings')
  ))

  describe('page template', function () {
    let $state

    beforeEach(angular.mock.inject(function (_$state_) {
      $state = _$state_
    }))

    it('should match the file contents', function () {
      const {
        template
      } = $state.get('settings')
      const contents = fs.readFileSync('lib/gui/app/pages/settings/templates/settings.tpl.html', {
        encoding: 'utf-8'
      })
      m.chai.expect(template).to.equal(contents)
    })
  })
})
