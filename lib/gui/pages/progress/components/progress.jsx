/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

const _ = require('lodash')
const React = require('react')
const propTypes = require('prop-types')
const flashState = require('../../../../shared/models/flash-state')
const styled = require('styled-components').default

class ProgressGauge extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      percentage: props.percentage || 0
    }
  }

  render() {
    const wrapStyles = {
      border: '2px solid gray',
      borderRadius: '50%',
      width: this.props.size,
      height: this.props.size,
      position: 'relative'
    }

    const clipStyles = {
      width: '100%',
      height: '100%',
      clipPath: this.props.percentage >= 50
        ? 'none'
        : 'inset(-5px -5px -5px 49.5%)'
    }

    const sideStyles = {
      width: 'calc(100% + 4px)',
      height: 'calc(100% + 4px)',
      marginTop: '-2px',
      marginLeft: '-2px',
      border: '5px solid #0074D9',
      borderRadius: '50%',
      position: 'absolute',
      clipPath: 'inset(-5px 50% -5px -5px)',
      transition: 'all 0.2s'
    }

    const degreeFactor = 3.6
    const progressDegrees = Math.round(this.props.percentage * degreeFactor)

    const leftStyles = _.assign({}, sideStyles, {
      transform: `rotate(${progressDegrees}deg)`
    })

    const rightStyles = _.assign({}, sideStyles, {
      transform: `rotate(${Math.min(progressDegrees, 180)}deg)`
    })

    const labelStyles = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%'
    }

    return (
      <div style={ wrapStyles }>
        <div style={ clipStyles }>
          <div style={ leftStyles }></div>
          <div style={ rightStyles }></div>
        </div>
        <div style={ labelStyles }>{ this.props.children }</div>
      </div>
    )
  }
}

const StyledProgressGauge = styled(ProgressGauge)`
`

const StyledPercentageText = styled.div`
  font-size: 24px;
  color: white;
  font-weight: bold;
`

const StyledProgressGaugeWrapper = styled.div`
`

class ProgressMetadata extends React.PureComponent {
  render() {
    return (
      <div>
        <div>{ this.props.title }</div>
        <div>{ this.props.subtitle }</div>
      </div>
    )
  }
}

const StyledProgressPageWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  height: 300px;
  margin-top: -50px;
`

class ProgressPage extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      currentFlashStates: props.states
    }
  }

  render() {
    const size = (60 / ((this.props.states || []).length || 1)) || 100
    const cssSize = `${size}vh`

    const gauges = this.state.currentFlashStates.map((state) => {
      return (
        <StyledProgressGaugeWrapper>
          <ProgressGauge percentage={ state.percentage } size={ cssSize }>
            <StyledPercentageText>
              { `${state.percentage}%` }
            </StyledPercentageText>
          </ProgressGauge>
          <ProgressMetadata
            title={ state.device }
            subtitle={ `${state.speed} MB/s` }>
          </ProgressMetadata>
        </StyledProgressGaugeWrapper>
      )
    })

    return (
      <StyledProgressPageWrapper>
        { gauges }
      </StyledProgressPageWrapper>
    )
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps) {
      return
    }

    this.setState({
      currentFlashStates: nextProps.states
    })
  }
}

ProgressPage.propTypes = {
  states: propTypes.arrayOf(propTypes.shape({
    percentage: propTypes.number
  }))
}

module.exports = ProgressPage
