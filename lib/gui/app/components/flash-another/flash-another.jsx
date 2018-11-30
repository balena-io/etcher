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

const FlashAnother = (props) => {
  return (
    <div>
      <button className="button button-primary button-brick" onClick={props.onClick.bind(null, { preserveImage: true })}>
        <b>Flash Another</b>
      </button>
    </div>
  )
}

FlashAnother.propTypes = {
  onClick: propTypes.func
}

module.exports = FlashAnother
