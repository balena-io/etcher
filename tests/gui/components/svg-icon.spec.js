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
const angular = require('angular')
require('angular-mocks')

describe('Browser: SVGIcon', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/components/svg-icon')
  ))

  describe('svgIcon', function () {
    let $compile
    let $rootScope

    beforeEach(angular.mock.inject(function (_$compile_, _$rootScope_) {
      $compile = _$compile_
      $rootScope = _$rootScope_
    }))

    it('should inline the svg contents in the element', function () {
      const icon = '../../../lib/gui/assets/etcher.svg'
      let iconContents = _.split(fs.readFileSync(path.join(__dirname, '../../../lib/gui/assets/etcher.svg'), {
        encoding: 'utf8'
      }), /\r?\n/)

      // Injecting XML as HTML causes the XML header to be commented out.
      // Modify here to ease assertions later on.
      iconContents[0] = `<!--${iconContents[0].slice(1, iconContents[0].length - 1)}-->`
      iconContents = iconContents.join('\n')

      const element = $compile(`<svg-icon path="'${icon}'">Resin.io</svg-icon>`)($rootScope)
      $rootScope.$digest()

      // We parse the SVGs to get rid of discrepancies caused by string differences
      // in the outputs; the XML trees are still equal, as proven here.
      const originalSVGParser = new DOMParser()
      const originalDoc = originalSVGParser.parseFromString(iconContents, 'image/svg+xml')
      const compiledSVGParser = new DOMParser()
      const compiledContents = decodeURIComponent(element.children()[0].src.substr(19))
      const compiledDoc = compiledSVGParser.parseFromString(compiledContents, 'image/svg+xml')

      m.chai.expect(compiledDoc.outerHTML).to.equal(originalDoc.outerHTML)
    })

    it('should accept an SVG in the path attribute', function () {
      const iconContents = '<svg><rect x="10" y="10" height="100" width="100" style="stroke:red;fill:blue;"/></svg>'
      const imgData = `data:image/svg+xml,${encodeURIComponent(iconContents)}`
      $rootScope.iconContents = iconContents

      const element = $compile('<svg-icon path="iconContents">Resin.io</svg-icon>')($rootScope)
      $rootScope.$digest()
      m.chai.expect(element.children().attr('src')).to.equal(imgData)
    })

    it('should use an empty src if there is a parsererror', function () {
      // The following is invalid, because there's no closing tag for `foreignObject`
      const iconContents = '<svg><foreignObject></svg>'
      const imgData = 'data:image/svg+xml,'
      $rootScope.iconContents = iconContents

      const element = $compile('<svg-icon path="iconContents">Resin.io</svg-icon>')($rootScope)
      $rootScope.$digest()
      m.chai.expect(element.children().attr('src')).to.equal(imgData)
    })

    it('should default the size to 40x40 pixels', function () {
      const icon = '../../../lib/gui/assets/etcher.svg'
      const element = $compile(`<svg-icon path="'${icon}'">Resin.io</svg-icon>`)($rootScope)
      $rootScope.$digest()
      m.chai.expect(element.children().css('width')).to.equal('40px')
      m.chai.expect(element.children().css('height')).to.equal('40px')
    })

    it('should be able to set a custom width', function () {
      const icon = '../../../lib/gui/assets/etcher.svg'
      const element = $compile(`<svg-icon path="'${icon}'" width="'20px'">Resin.io</svg-icon>`)($rootScope)
      $rootScope.$digest()
      m.chai.expect(element.children().css('width')).to.equal('20px')
      m.chai.expect(element.children().css('height')).to.equal('40px')
    })

    it('should be able to set a custom height', function () {
      const icon = '../../../lib/gui/assets/etcher.svg'
      const element = $compile(`<svg-icon path="'${icon}'" height="'20px'">Resin.io</svg-icon>`)($rootScope)
      $rootScope.$digest()
      m.chai.expect(element.children().css('width')).to.equal('40px')
      m.chai.expect(element.children().css('height')).to.equal('20px')
    })
  })
})
