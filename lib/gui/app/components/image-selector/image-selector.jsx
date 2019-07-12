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
const { Badge, DropDownButton, Select } = require('rendition')
const { default: styled } = require('styled-components')

const middleEllipsis = require('./../../utils/middle-ellipsis')

const shared = require('./../../../../gui/app/modules/units')
const {
  StepButton,
  StepNameButton,
  StepSelection,
  Footer,
  Underline,
  DetailsText,
  ChangeButton,
  ThemedProvider
} = require('./../../styled-components')

const DropdownItem = styled.p`
  padding-top: 10px;
  text-align: left;
  width: 150px;
  cursor: pointer;
`

const DropdownItemIcon = styled.i`
  padding-right: 10px;
`

const SelectImageButton = (props) => {
  if (props.hasImage) {
    return (
      <ThemedProvider>
        <StepNameButton
          plain
          onClick={props.showSelectedImageDetails}
          tooltip={props.imageBasename}
        >
          {/* eslint-disable no-magic-numbers */}
          { middleEllipsis(props.imageName || props.imageBasename, 20) }
        </StepNameButton>
        { !props.flashing &&
          <ChangeButton
            plain
            mb={14}
            onClick={props.deselectImage}
          >
            Remove
          </ChangeButton>
        }
        <DetailsText>
          {shared.bytesToClosestUnit(props.imageSize)}
        </DetailsText>
      </ThemedProvider>
    )
  }
  return (
    <ThemedProvider>
      <StepSelection>
        <DropDownButton
          primary
          label={
            <div onClick={props.openImageSelector}>Select image</div>
          }
          style={{height: '48px'}}
        >
          <DropdownItem
            onClick={props.openImageSelector}
          >
            <DropdownItemIcon className="far fa-file"/>
            Select image file
          </DropdownItem>
          <DropdownItem
            onClick={props.openDriveSelector}
          >
            <DropdownItemIcon className="far fa-copy"/>
            Duplicate drive
          </DropdownItem>
        </DropDownButton>
        <Footer>
          { props.mainSupportedExtensions.join(', ') }, and{' '}
          <Underline
            tooltip={ props.extraSupportedExtensions.join(', ') }
          >
            many more
          </Underline>
        </Footer>
      </StepSelection>
    </ThemedProvider>
  )
}

SelectImageButton.propTypes = {
  openImageSelector: propTypes.func,
  openDriveSelector: propTypes.func,
  mainSupportedExtensions: propTypes.array,
  extraSupportedExtensions: propTypes.array,
  hasImage: propTypes.bool,
  showSelectedImageDetails: propTypes.func,
  imageName: propTypes.string,
  imageBasename: propTypes.string,
  deselectImage: propTypes.func,
  flashing: propTypes.bool,
  imageSize: propTypes.number,
  sourceType: propTypes.string
}

module.exports = SelectImageButton
