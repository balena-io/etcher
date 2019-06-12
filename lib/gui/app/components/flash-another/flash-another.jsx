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
const PropTypes = require('prop-types')
const styled = require('styled-components').default
const { position, right } = require('styled-system')
const { BaseButton, ThemedProvider } = require('../../styled-components')

const Div = styled.div `
  ${position}
  ${right}
`

const FlashAnother = (props) => {
  return (
    <ThemedProvider>
      <Div position='absolute' right='152px'>
        <BaseButton
          primary
          onClick={props.onClick.bind(null, { preserveImage: true })}>
          Flash Another
        </BaseButton>
      </Div>
    </ThemedProvider>
  )
}

FlashAnother.propTypes = {
  onClick: PropTypes.func
}

module.exports = FlashAnother
