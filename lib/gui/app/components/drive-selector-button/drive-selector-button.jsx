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

const _ = require('lodash')
const React = require('react')
const propTypes = require('prop-types')

/* eslint-disable no-magic-numbers */

const middleEllipsis = require('./../../utils/middle-ellipsis')

const { Provider, Txt } = require('rendition')
const {
  StepButton,
  StepNameButton,
  StepSelection,
  DetailsText,
  ChangeButton
} = require('./../../styled-components')

class DriveSelectorButton extends React.PureComponent {
  allDevicesFooter () {
    return _.map(this.props.selectedDevices, (device) =>
      <Txt key={device.device} tooltip={ `${device.description}(${device.displayName})` }>
        { middleEllipsis(device.description, 14) }
      </Txt>
    )
  }

  render () {
    if (this.props.hasDrive || !this.props.shouldShowDrivesButton) {
      return (
        <Provider>
          <StepSelection>
            <StepNameButton
              plaintext
              disabled={this.props.disabled}
              tooltip={this.props.driveListLabel}
              warning={!this.props.howManyDeviceSelected}
            >
              { middleEllipsis(this.props.drivesTitle, 20) }
              { this.props.hasCompatibilityStatus &&
                <Txt.span className='glyphicon glyphicon-exclamation-sign'
                  ml={2}
                  tooltip={this.props.getCompatibilityStatuses}
                />
              }
            </StepNameButton>

            <DetailsText>
              {this.props.driveSize}
            </DetailsText>
            { !this.props.flashing && this.props.shouldShowDrivesButton &&
              <ChangeButton
                plaintext
                onClick={this.props.reselectDrive}
              >
                Change
              </ChangeButton>
            }
            <DetailsText>
              {
                this.props.selectedDevices.length > 1 &&
                this.allDevicesFooter()
              }
            </DetailsText>
          </StepSelection>
        </Provider>
      )
    }
    return (
      <Provider>
        <StepSelection>
          <StepButton
            primary
            disabled={this.props.disabled}
            onClick={this.props.openDriveSelector}
          >
            Select drive
          </StepButton>
        </StepSelection>
      </Provider>
    )
  }
}

DriveSelectorButton.propTypes = {
  hasDrive: propTypes.bool,
  shouldShowDrivesButton: propTypes.bool,
  disabled: propTypes.bool,
  drivesTitle: propTypes.string,
  driveListLabel: propTypes.string,
  openDriveSelector: propTypes.func,
  howManyDeviceSelected: propTypes.number,
  reselectDrive: propTypes.func,
  driveSize: propTypes.string,
  hasCompatibilityStatus: propTypes.bool,
  getCompatibilityStatuses: propTypes.array,
  selectedDevices: propTypes.array
}

module.exports = DriveSelectorButton
