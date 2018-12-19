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

const React = require('react')
const PropTypes = require('prop-types')
const styled = require('styled-components').default
const { position, right } = require('styled-system')

const Div = styled.div `
  ${position}
  ${right}
`

const FlashAnother = (props) => {
  return (
    <Div position='absolute' right='152px'>
      <button className="button button-primary button-brick" onClick={props.onClick.bind(null, { preserveImage: true })}>
        <b>Flash Another</b>
      </button>
    </Div>
  )
}

FlashAnother.propTypes = {
  onClick: PropTypes.func
}

module.exports = FlashAnother
