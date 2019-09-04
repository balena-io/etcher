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
const propTypes = require('prop-types')
const Color = require('color')
const {
  default: styled,
  css,
  keyframes
} = require('styled-components')
const {
  Button,
  ProgressBar,
  Provider
} = require('rendition')
const { colors } = require('../../theme')
const { StepButton, StepSelection: StepSelectionBase } = require('../../styled-components')

const darkenForegroundStripes = 0.18
const desaturateForegroundStripes = 0.2
const progressButtonStripesForegroundColor = Color(colors.primary.background)
  .darken(darkenForegroundStripes)
  .desaturate(desaturateForegroundStripes)
  .string()

const desaturateBackgroundStripes = 0.05
const progressButtonStripesBackgroundColor = Color(colors.primary.background)
  .desaturate(desaturateBackgroundStripes)
  .string()

const ProgressButtonStripes = keyframes `
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 20px 20px;
  }
`

const ProgressButtonStripesRule = css `
  ${ProgressButtonStripes} 1s linear infinite;
`

const FlashProgressLabel = styled.div `
  font-size: 16px;
  color: white;
  text-align: left;
  margin-bottom: 10px;
  float: left;

  > strong {
    color: #1ac135
  }
`

const FlashProgressBar = styled(ProgressBar) `
  > div {
    width: 220px;
    height: 12px;
    color: white !important;
    text-shadow: none !important;
  }

  width: 220px;
  height: 12px;
  font-size: 16px;
  line-height: 12px;

  background: #2f3033;
`

const FlashProgressBarValidating = styled(FlashProgressBar) `

  // Notice that we add 0.01 to certain gradient stop positions.
  // That workarounds a Chrome rendering issue where diagonal
  // lines look spiky.
  // See https://github.com/resin-io/etcher/issues/472

  background-image: -webkit-gradient(linear, 0 0, 100% 100%,
    color-stop(0.25, ${progressButtonStripesForegroundColor}),
    color-stop(0.26, ${progressButtonStripesBackgroundColor}),
    color-stop(0.50, ${progressButtonStripesBackgroundColor}),
    color-stop(0.51, ${progressButtonStripesForegroundColor}),
    color-stop(0.75, ${progressButtonStripesForegroundColor}),
    color-stop(0.76 , ${progressButtonStripesBackgroundColor}),
    to(${progressButtonStripesBackgroundColor}));

  background-color: white;

  animation: ${ProgressButtonStripesRule};
  overflow: hidden;

  background-size: 20px 20px;
`

const StepSelection = styled(StepSelectionBase) `
  width: 220px;
  margin: auto;
`

const CancelButton = styled(({ cancel, ...props }) => {
  return (
    <Button
      {...props}
      onClick={ cancel }
      plain
      p='0'
      width='auto'
      color={colors.primary.background}
    >
      Cancel
    </Button>
  )
}) `
  float: right;
`

/**
 * Progress Button component
 */
class ProgressButton extends React.Component {
  render () {
    if (this.props.active) {
      if (this.props.striped) {
        return (
          <Provider>
            <StepSelection>
              <FlashProgressLabel
                dangerouslySetInnerHTML={{ __html: this.props.label }}
              >
              </FlashProgressLabel>
              <CancelButton
                cancel={ this.props.cancel }
              >
              </CancelButton>
              <FlashProgressBarValidating
                primary
                emphasized
                value= { this.props.percentage }
              >
              </FlashProgressBarValidating>
            </StepSelection>
          </Provider>
        )
      }

      return (
        <Provider>
          <StepSelection>
            <FlashProgressLabel
              dangerouslySetInnerHTML={{ __html: this.props.label }}
            >
            </FlashProgressLabel>
            <CancelButton
              cancel={ this.props.cancel }
            ></CancelButton>
            <FlashProgressBar
              emphasized
              value= { this.props.percentage }
              background='#1ac135'
            />
          </StepSelection>
        </Provider>
      )
    }

    return (
      <Provider>
        <StepSelection>
          <StepButton
            onClick= { this.props.callback }
            disabled= { this.props.disabled }
          >
            { this.props.label }
          </StepButton>
        </StepSelection>
      </Provider>
    )
  }
}

ProgressButton.propTypes = {
  striped: propTypes.bool,
  active: propTypes.bool,
  percentage: propTypes.number,
  label: propTypes.string,
  disabled: propTypes.bool,
  callback: propTypes.func,
  cancel: propTypes.func
}

module.exports = ProgressButton
