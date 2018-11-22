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
const styled = require('styled-components').default
const SvgIcon = require('../svg-icon/svg-icon.jsx')

const Div = styled.div `
  position: absolute;
  top: 45px;
  left: 550px;

  > span.step-name {
    justify-content: flex-start;

    > span {
      margin-left: 5px;
      font-weight: normal;
    }
  }

  .svg-icon[disabled] {
    opacity: 0.4;
  }
`

const ReducedFlashingInfos = (props) => {
  return (props.shouldShow) ? (
    <Div>
      <span className="step-name">
        <SvgIcon disabled contents={[ props.imageLogo ]} paths={[ '../../assets/image.svg' ]} width='20px'></SvgIcon>
        <span>{ props.imageName }</span>
        <span style={{ color: '#7e8085' }}>{ props.imageSize }</span>
      </span>

      <span className="step-name">
        <SvgIcon disabled paths={[ '../../assets/drive.svg' ]} width='20px'></SvgIcon>
        <span>{ props.driveTitle }</span>
      </span>
    </Div>
  ) : null
}

ReducedFlashingInfos.propTypes = {
  imageLogo: propTypes.string,
  imageName: propTypes.string,
  imageSize: propTypes.string,
  driveTitle: propTypes.string,
  shouldShow: propTypes.bool
}

module.exports = ReducedFlashingInfos
