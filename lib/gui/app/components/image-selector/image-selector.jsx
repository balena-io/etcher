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

const React = require('react')
const ReactDOM = require('react-dom')
const propTypes = require('prop-types')

const middleEllipsis = require('./../../utils/middle-ellipsis')

const { Provider } = require('rendition')

const shared = require('/./../../../../../lib/shared/units')
const { StepButton, StepNameButton, StepSelection,
  Footer, Underline, DetailsText, ChangeButton } = require('./../../styled-components')

const DetailsModal = require('./../details-modal/details-modal')

class SelectImageButton extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      showImageDetails: false
    }
  }

  render() {
    let imageSize = shared.bytesToClosestUnit(this.props.imageSize)
    if (this.props.hasImage){
      return (
        <Provider>
          <StepSelection>
            <StepNameButton
              plaintext
              onClick={() => this.setState({ showImageDetails: true })}
              tooltip={this.props.imageBasename}
            >
              {middleEllipsis(this.props.imageName || this.props.imageBasename , 20)}
            </StepNameButton>
            <DetailsText>
              {shared.bytesToClosestUnit(this.props.imageSize)}
            </DetailsText>
            { !this.props.flashing &&
              <ChangeButton
                plaintext
                onClick={this.props.reselectImage}
                primary
              >
                Change
              </ChangeButton>
            }
          </StepSelection>
          {this.state.showImageDetails &&
            <DetailsModal
              title={'IMAGE DETAILS'}
              details={
                [{
                  path: this.props.imagePath,
                  name: this.props.imageName || this.props.imageBasename,
                  size: imageSize
                }]
              }
              callback={() => this.setState({ showImageDetails: false })}
            />
          }
        </Provider>
      )
    }
    return (
      <Provider>
        <StepSelection>
          <StepButton
            primary
            onClick={this.props.openImageSelector}
          >
            Select image
          </StepButton>
          <Footer>
            { this.props.mainSupportedExtensions.join(', ') }, and {' '}
            <Underline
              tooltip={ this.props.extraSupportedExtensions.join(', ') }
            >
              others
            </Underline>
          </Footer>
        </StepSelection>
      </Provider>
    )
  }
}

SelectImageButton.propTypes = {
  openImageSelector: propTypes.func,
  mainSupportedExtensions: propTypes.array,
  extraSupportedExtensions: propTypes.array,
  hasImage: propTypes.bool,
  imageName: propTypes.string,
  imageBasename: propTypes.string,
  reselectImage: propTypes.func,
  flashing: propTypes.bool,
  imageSize: propTypes.number,
  imagePath: propTypes.string
}

module.exports = SelectImageButton
