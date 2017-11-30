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
const prettyBytes = require('pretty-bytes')
const path = require('path')

const ProgressContainer = styled.div`
  background-color: gray;
  border-radius: ${props => props.height};
  width: ${props => props.width };
  height: ${props => props.height };
  overflow: hidden;
`

const ProgressFill = styled.div`
  background-color: ${props => props.color};
  height: ${props => props.height };
  width: ${props => props.value}%;
  transition: width 0.2s;
`

class ProgressBar extends React.PureComponent {
  render() {
    return (
      <ProgressContainer width={ this.props.width } height={ this.props.height }>
        <ProgressFill
          value={ this.props.value }
          height={ this.props.height }
          color={ this.props.color }
        />
      </ProgressContainer>
    )
  }
}

const StyledTotalProgressBarWrapper = styled.div`
  width: 33%;
`

const StyledTotalProgressBarLabel = styled.div`
  display: flex;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin-bottom: 7px;
`

const StyledTotalProgressBarSubtitle = styled.div`
  display: flex;
  justify-content: space-between;
  color: gray;
  margin-top: 5px;
`

class TitleWithProgressBar extends React.PureComponent {
  render() {
    return (
      <StyledTotalProgressBarWrapper>
        <StyledTotalProgressBarLabel>{ this.props.label }</StyledTotalProgressBarLabel>
        <ProgressBar
          value={ this.props.percent }
          width={ '220px' }
          height={ '7px' }
          color={ this.props.color }
        />
        <StyledTotalProgressBarSubtitle>
          <div>{ this.props.leftSubtitle }</div>
          <div>{ this.props.rightSubtitle }</div>
        </StyledTotalProgressBarSubtitle>
      </StyledTotalProgressBarWrapper>
    )
  }
}

const Title = styled.span`
  color: white;
  font-weight: bold;
`

const Dim = styled.span`
  color: gray;
`

const DriveStatusWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 33%;
`

class DriveStatus extends React.PureComponent {
  render() {
    return (
      <DriveStatusWrapper>
        <Title>{ this.props.label }</Title>&nbsp;<Dim>({ this.props.quantity })</Dim>
      </DriveStatusWrapper>
    )
  }
}

const StyledProgressGaugeSidesWrapper = styled.div`
  border: 7px solid gray;
  border-radius: 50%;
  width: ${props => props.size};
  height: ${props => props.size};
  position: relative;
`

const StyledProgressGaugeSides = styled.div`
  width: calc(100% + 14px);
  height: calc(100% + 14px);
  margin-top: -7px;
  margin-left: -7px;
  border: 7px solid ${props => props.color};
  border-radius: 50%;
  position: absolute;
  clip-path: inset(0 50% 0 0);
  transition: transform 0.2s;
`

const StyledProgressGaugeLabel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

class ProgressGauge extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      percentage: props.percentage || 0
    }
  }

  render() {
    const clipStyles = {
      width: '100%',
      height: '100%',
    }

    const degreeFactor = 3.6
    const progressDegrees = Math.round(this.props.percentage * degreeFactor)

    const leftStyles = {
      transform: `rotate(${Math.min(progressDegrees, 180)}deg)`
    }

    const rightStyles = {
      transform: `rotate(${progressDegrees < 180 ? 0 : progressDegrees}deg)`,
      borderColor: progressDegrees < 180 ? 'gray' : this.props.color
    }

    return (
      <StyledProgressGaugeSidesWrapper size={ this.props.size } minSize={ this.props.minSize }>
        <div style={ clipStyles }>
          <StyledProgressGaugeSides style={ leftStyles } color={ this.props.color } />
          <StyledProgressGaugeSides style={ rightStyles } />
        </div>
        <StyledProgressGaugeLabel>{ this.props.children }</StyledProgressGaugeLabel>
      </StyledProgressGaugeSidesWrapper>
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

const StyledProgressGaugesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  height: 300px;
`

const StyledProgressPageWrapper = styled.div`
  margin-top: -50px;
`

const StyledProgressHeader = styled.header`
  display: flex;
  justify-content: space-between;
`

class ProgressPage extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      currentFlashStates: props.states
    }
  }

  render() {
    const size = '80px'
    const sizes = [
      0, 100, 50, 33, 50, 33, 33, 25, 25
    ]
    const minSize = sizes[_.get(this.props.states, [ 'length' ], 0)] + '%'

    // TODO move elsewhere in codebase
    const stateLabels = {
      write: 'Writing',
      check: 'Verifying',
      backup: 'Backing up',
      undefined: 'Starting'
    }

    const gauges = this.props.states.map((state) => {
      const isDone = state.percentage === 100

      const checkmarkElement = (
        <span className="tick tick--success" />
      )

      const percentageText = (
        <StyledPercentageText size={ size / 3 }>
          { `${state.percentage}%` }
        </StyledPercentageText>
      )

      const centerPiece = isDone ? checkmarkElement : percentageText
      const gaugeColor = isDone ? '#5fb835' : '#ff912f'

      const { description } = availableDrives.findDriveByDevice(state.device) || {}

      return (
        <StyledProgressGaugeWrapper>
          <ProgressGauge percentage={ state.percentage } size={ size } minSize={ minSize } color={ gaugeColor }>
            { centerPiece }
          </ProgressGauge>
          <ProgressMetadata
            title={ description }
            subtitle={ `${stateLabels[state.type]} - ${state.speed} MB/s` }>
          </ProgressMetadata>
        </StyledProgressGaugeWrapper>
      )
    })

    const totalState = flashState.getAverageFlashState()
    const { percentage } = totalState
    const totalSpeed = prettyBytes(totalState.speed) + '/s'
    const totalEta = `ETA: ${Math.round((totalState.eta || 0) * 100) / 100}s`
    const isTotalDone = percentage === 100
    const totalLabel = isTotalDone ? 'Done' : stateLabels[totalState.type] + '...'

    const source = selectionState.getImage()

    const drives = selectionState.getSelectedDrives()
    const driveLabel = drives.length === 1 ? drives[0].description : 'Multiple drives'

    return (
      <StyledProgressPageWrapper>
        <StyledProgressHeader>
          <TitleWithProgressBar
            leftSubtitle={ path.basename(_.get(source, [ 'path' ], 'None')) }
            rightSubtitle={ '' }
            percent={ 100 }
            label={ 'Source' }
            color={ '#5fb835' }
          />
          <DriveStatus
            label={ driveLabel }
            quantity={ drives.length }
          />
          <TitleWithProgressBar
            leftSubtitle={ totalSpeed }
            rightSubtitle={ totalEta }
            percent={ percentage }
            label={ totalLabel }
            color={ isTotalDone ? '#5fb835' : '#ff912f' }
          />
        </StyledProgressHeader>
        <StyledProgressGaugesWrapper>
          { gauges }
        </StyledProgressGaugesWrapper>
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
