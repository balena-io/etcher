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

/* eslint-disable jsdoc/require-example */

/**
 * @module Etcher.Components.SVGIcon
 */

const _ = require('lodash')
const angular = require('angular')
const react = require('react')
const propTypes = require('prop-types')
const react2angular = require('react2angular').react2angular
const path = require('path')
const fs = require('fs')
const analytics = require('../modules/analytics')

const MODULE_NAME = 'Etcher.Components.SVGIcon'
const angularSVGIcon = angular.module(MODULE_NAME, [])

const DEFAULT_SIZE = '40px'

const domParser = new window.DOMParser()

/**
 * @summary Try to parse SVG contents and return it data encoded
 *
 * @param {String} contents - SVG XML contents
 * @returns {String|null}
 *
 * @example
 * const encodedSVG = tryParseSVGContents('<svg><path></path></svg>')
 *
 * img.src = encodedSVG
 */
const tryParseSVGContents = (contents) => {
  const doc = domParser.parseFromString(contents, 'image/svg+xml')
  const parserError = doc.querySelector('parsererror')
  const svg = doc.querySelector('svg')

  if (!parserError && svg) {
    return `data:image/svg+xml,${encodeURIComponent(svg.outerHTML)}`
  }

  return null
}

/**
 * @summary SVG element that takes both filepaths and file contents
 * @type {Object}
 * @public
 */
class SVGIcon extends react.Component {
  /**
   * @summary Render the SVG
   * @returns {react.Element}
   */
  render () {
    // __dirname behaves strangely inside a Webpack bundle,
    // so we need to provide different base directories
    // depending on whether __dirname is absolute or not,
    // which helps detecting a Webpack bundle.
    // We use global.__dirname inside a Webpack bundle since
    // that's the only way to get the "real" __dirname.
    const baseDirectory = path.isAbsolute(__dirname)
      ? path.join(__dirname, '..')
      // eslint-disable-next-line no-underscore-dangle
      : global.__dirname

    let svgData = ''

    _.find(this.props.contents, (content) => {
      const attempt = tryParseSVGContents(content)

      if (attempt) {
        svgData = attempt
        return true
      }

      return false
    })

    if (!svgData) {
      _.find(this.props.paths, (relativePath) => {
        // This means the path to the icon should be
        // relative to *this directory*.
        // TODO: There might be a way to compute the path
        // relatively to the `index.html`.
        const imagePath = path.join(baseDirectory, 'assets', relativePath)

        const contents = _.attempt(() => {
          return fs.readFileSync(imagePath, {
            encoding: 'utf8'
          })
        })

        if (_.isError(contents)) {
          analytics.logException(contents)
          return false
        }

        const parsed = _.attempt(tryParseSVGContents, contents)

        if (parsed) {
          svgData = parsed
          return true
        }

        return false
      })
    }

    const width = this.props.width || DEFAULT_SIZE
    const height = this.props.height || DEFAULT_SIZE

    return react.createElement('img', {
      className: 'svg-icon',
      style: {
        width,
        height
      },
      src: svgData,
      disabled: this.props.disabled
    })
  }

  /**
   * @summary Cause a re-render due to changed element properties
   * @param {Object} nextProps - the new properties
   */
  componentWillReceiveProps (nextProps) {
    // This will update the element if the properties change
    this.setState(nextProps)
  }
}

SVGIcon.propTypes = {

  /**
   * @summary Paths to SVG files to be tried in succession if any fails
   */
  paths: propTypes.array,

  /**
   * @summary List of embedded SVG contents to be tried in succession if any fails
   */
  contents: propTypes.array,

  /**
   * @summary SVG image width unit
   */
  width: propTypes.string,

  /**
   * @summary SVG image height unit
   */
  height: propTypes.string,

  /**
   * @summary Should the element visually appear grayed out and disabled?
   */
  disabled: propTypes.bool

}

angularSVGIcon.component('svgIcon', react2angular(SVGIcon))
module.exports = MODULE_NAME
