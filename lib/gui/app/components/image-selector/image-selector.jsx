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

/* eslint-disable no-unused-vars */
const React = require('react')
const propTypes = require('prop-types')

const middleEllipsis = require('./../../utils/middle-ellipsis')

const { Provider } = require('rendition')

const shared = require('./../../../../shared/units')
const {
  StepButton,
  StepNameButton,
  StepSelection,
  Footer,
  Underline,
  DetailsText,
  ChangeButton
} = require('./../../styled-components')

const SelectImageButton = (props) => {
  if (props.hasImage) {
    return (
      <Provider>
        <StepNameButton
          plain
          onClick={props.showSelectedImageDetails}
          tooltip={props.imageBasename}
        >
          {/* eslint-disable no-magic-numbers */}
          { middleEllipsis(props.imageName || props.imageBasename, 20) }
        </StepNameButton>
        <DetailsText>
          {shared.bytesToClosestUnit(props.imageSize)}
        </DetailsText>
        { !props.flashing &&
          <ChangeButton
            plain
            onClick={props.reselectImage}
          >
            Change
          </ChangeButton>
        }
      </Provider>
    )
  }
  return (
    <Provider>
      <StepSelection>
        <StepButton
          onClick={props.openImageSelector}
        >
          Select image
        </StepButton>
        <Footer>
          { props.mainSupportedExtensions.join(', ') }, and{' '}
          <Underline
            tooltip={ props.extraSupportedExtensions.join(', ') }
          >
            many more
          </Underline>
        </Footer>
      </StepSelection>
    </Provider>
  )
}

SelectImageButton.propTypes = {
  openImageSelector: propTypes.func,
  mainSupportedExtensions: propTypes.array,
  extraSupportedExtensions: propTypes.array,
  hasImage: propTypes.bool,
  showSelectedImageDetails: propTypes.func,
  imageName: propTypes.string,
  imageBasename: propTypes.string,
  reselectImage: propTypes.func,
  flashing: propTypes.bool,
  imageSize: propTypes.number
}

module.exports = SelectImageButton
