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

// eslint-disable-next-line no-unused-vars
const React = require('react')
const { default: styled } = require('styled-components')
const { colors } = require('./theme')
const {
  Button, Txt, Flex, Provider
} = require('rendition')

const theme = {
  button: {
    border: {
      width: '0',
      radius: '2px'
    },
    disabled: {
      opacity: 1
    },
    extend: (props) => `
      width: 200px;
      min-height: 48px;
      font-size: 16px;

      &:disabled {
        background-color: ${colors.dark.disabled.background};
        color: ${colors.dark.disabled.foreground};
        opacity: 1;

        &:hover {
          background-color: ${colors.dark.disabled.background};
          color: ${colors.dark.disabled.foreground};
        }
      }
    `
  }
}

exports.StepButton = (props) => {
  return (
    <Provider theme={theme}>
      <Button primary {...props}>
      </Button>
    </Provider>
  )
}

exports.ChangeButton = styled(Button) `
  color: ${colors.primary.background};
  padding: 0;
  width: 100%;

  &:hover, &:focus, &:active {
    color: ${colors.primary.background};
  }
`
exports.StepNameButton = styled(Button) `
  display: flex;
  justify-content: center;
  align-items: center;
  height: 39px;
  width: 100%;
  font-weight: bold;
  color: ${colors.dark.foreground};

  &:hover, &:focus, &:active{
    color: ${colors.primary.foreground};
  }
`
exports.StepSelection = styled(Flex) `
  flex-wrap: wrap;
  justify-content: center;
`
exports.Footer = styled(Txt) `
  margin-top: 10px;
  color: ${colors.dark.disabled.foreground};
  font-size: 10px;
`
exports.Underline = styled(Txt.span) `
  border-bottom: 1px dotted;
  padding-bottom: 2px;
`
exports.DetailsText = styled(Txt.p) `
  color: ${colors.dark.disabled.foreground};
  margin-bottom: 8px;
`
