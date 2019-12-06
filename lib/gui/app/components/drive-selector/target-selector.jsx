/*
 * Copyright 2019 resin.io
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

/* eslint-disable no-magic-numbers */

'use strict'

// eslint-disable-next-line no-unused-vars
const React = require('react')
const propTypes = require('prop-types')
const { default: styled } = require('styled-components')
const {
  ChangeButton,
  DetailsText,
  StepButton,
  StepNameButton
} = require('./../../styled-components')
const { Txt } = require('rendition')
const middleEllipsis = require('./../../utils/middle-ellipsis')
const { bytesToClosestUnit } = require('./../../../../shared/units')

const TargetDetail = styled((props) => (
  <Txt.span {...props}>
  </Txt.span>
)) `
  float: ${({ float }) => float}
`

const TargetDisplayText = ({
  description,
  size,
  ...props
}) => {
  return (
    <Txt.span {...props}>
      <TargetDetail
        float='left'>
        {description}
      </TargetDetail>
      <TargetDetail
        float='right'
      >
        {size}
      </TargetDetail>
    </Txt.span>
  )
}

const TargetSelector = (props) => {
  const targets = props.selection.getSelectedDrives()

  if (targets.length === 1) {
    const target = targets[0]
    return (
      <React.Fragment>
        <StepNameButton
          plain
          tooltip={props.tooltip}
        >
          {/* eslint-disable no-magic-numbers */}
          { middleEllipsis(target.description, 20) }
        </StepNameButton>
        {!props.flashing &&
          <ChangeButton
            plain
            mb={14}
            onClick={props.reselectDrive}
          >
            Change
          </ChangeButton>
        }
        <DetailsText>
          { props.constraints.hasListDriveImageCompatibilityStatus(targets, props.image) &&
            <Txt.span className='glyphicon glyphicon-exclamation-sign'
              ml={2}
              tooltip={
                props.constraints.getListDriveImageCompatibilityStatuses(targets, props.image)[0].message
              }
            />
          }
          { bytesToClosestUnit(target.size) }
        </DetailsText>
      </React.Fragment>
    )
  }

  if (targets.length > 1) {
    const targetsTemplate = []
    for (const target of targets) {
      targetsTemplate.push((
        <DetailsText
          key={target.device}
          tooltip={
            `${target.description} ${target.displayName} ${bytesToClosestUnit(target.size)}`
          }
          px={21}
        >
          <TargetDisplayText
            description={middleEllipsis(target.description, 14)}
            size={bytesToClosestUnit(target.size)}
          >
          </TargetDisplayText>
        </DetailsText>
      ))
    }
    return (
      <React.Fragment>
        <StepNameButton
          plain
          tooltip={props.tooltip}
        >
          {targets.length} Targets
        </StepNameButton>
        { !props.flashing &&
          <ChangeButton
            plain
            onClick={props.reselectDrive}
            mb={14}
          >
            Change
          </ChangeButton>
        }
        {targetsTemplate}
      </React.Fragment>
    )
  }

  return (
    <StepButton
      tabindex={(targets.length > 0) ? -1 : 2 }
      disabled={props.disabled}
      onClick={props.openDriveSelector}
    >
      Select target
    </StepButton>
  )
}

TargetSelector.propTypes = {
  targets: propTypes.array,
  disabled: propTypes.bool,
  openDriveSelector: propTypes.func,
  selection: propTypes.object,
  reselectDrive: propTypes.func,
  flashing: propTypes.bool,
  constraints: propTypes.object,
  show: propTypes.bool,
  tooltip: propTypes.string
}

module.exports = TargetSelector
