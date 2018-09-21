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

const styled = require('styled-components').default
const {
  Button, Flex, Box
} = require('rendition')

const { colors } = require('./../../theme')

exports.ModalHeader = styled(Flex) `
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  color: ${colors.light.soft.foreground};
  font-weight: bold;
  padding: 11px 0;
  border-bottom: 1.5px solid ${colors.light.soft.background};
`
 exports.ModalBody = styled(Box) `
  padding: 20px;
  max-height: 250px;
  word-wrap: break-word;
  text-align: left;
   margin: -35px 15px -45px 15px;
`
 exports.CloseButton = styled(Button) `
  font-size: 19.5px;
  font-weight: bold;
  line-height: 1
  color: ${colors.light.soft.foreground};;
  cursor: pointer;
   &:hover {
    color: ${colors.dark.background};
  }
`
