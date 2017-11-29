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
    const borderSize = this.props.size / 2
    console.log(this.props.size)

    const wrapStyles = {
      border: `${borderSize}px solid gray`,
      borderRadius: '50%',
      width: Math.max(this.props.size, this.props.minSize) + 'vh',
      height: Math.max(this.props.size, this.props.minSize) + 'vh',
      position: 'relative'
    }

    const clipStyles = {
      width: '100%',
      height: '100%',
    }

    const sideStyles = {
      width: `calc(100% + ${borderSize * 2}px)`,
      height: `calc(100% + ${borderSize * 2}px)`,
      marginTop: `-${borderSize}px`,
      marginLeft: `-${borderSize}px`,
      border: `${borderSize}px solid #ff912f`,
      borderRadius: '50%',
      position: 'absolute',
      clipPath: 'inset(0 50% 0 0)',
      transition: 'all 0.2s'
    }

    const degreeFactor = 3.6
    const progressDegrees = Math.round(this.props.percentage * degreeFactor)

    const leftStyles = _.assign({}, sideStyles, {
      transform: `rotate(${Math.min(progressDegrees, 180)}deg)`
    })

    const rightStyles = _.assign({}, sideStyles, {
      transform: `rotate(${progressDegrees < 180 ? 0 : progressDegrees}deg)`,
      borderColor: progressDegrees < 180 ? 'gray' : '#ff912f'
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
  font-size: ${props => props.size}vh;
  color: white;
  font-weight: bold;
`

const StyledProgressGaugeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledProgressMetadataWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 5px;
`

const StyledProgressTitle = styled.div`
  font-weight: bold;
  color: white;
`

const StyledProgressSubtitle = styled.div`
  color: gray;
`

class ProgressMetadata extends React.PureComponent {
  render() {
    return (
      <StyledProgressMetadataWrapper>
        <StyledProgressTitle>{ this.props.title }</StyledProgressTitle>
        <StyledProgressSubtitle>{ this.props.subtitle }</StyledProgressSubtitle>
      </StyledProgressMetadataWrapper>
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
    const statesLength = (this.props.states || []).length || 1
    const size = Math.round(60 / statesLength)

    const lengthSizes = [
      100, 50, 33, 50, 33, 33, 25, 25, 33, 25, 25, 25
    ]
    const minSize = lengthSizes[statesLength]

    const gauges = this.props.states.map((state) => {
      // TODO move elsewhere in codebase
      const stateLabels = {
        write: 'Writing',
        check: 'Verifying',
        backup: 'Backing up'
      }

      return (
        <StyledProgressGaugeWrapper>
          <ProgressGauge percentage={ state.percentage } size={ size } minSize={ minSize }>
            <StyledPercentageText size={ size / 3 }>
              { `${state.percentage}%` }
            </StyledPercentageText>
          </ProgressGauge>
          <ProgressMetadata
            title={ state.device }
            subtitle={ `${stateLabels[state.type]} - ${state.speed} MB/s` }>
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
