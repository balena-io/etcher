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
const propTypes = require('prop-types')
const styled = require('styled-components').default
const rendition = require('rendition')
const colors = require('./colors')

const middleEllipsis = require('../../../utils/middle-ellipsis')

/**
 * @summary Flex styled component
 * @function
 * @type {ReactElement}
 */
const Flex = styled.div`
  display: flex;
  flex: ${ props => props.flex };
  flex-direction: ${ props => props.direction };
  justify-content: ${ props => props.justifyContent };
  align-items: ${ props => props.alignItems };
  flex-wrap: ${ props => props.wrap };
  flex-grow: ${ props => props.grow };
`

class RecentFileLink extends React.PureComponent {
  constructor (props) {
    super(props)
  }

  render () {
    const file = this.props.file
    return (
      <rendition.Button
        onClick={ ::this.select }
        plain={ true }>
        { middleEllipsis(file.name, FILENAME_CHAR_LIMIT_SHORT) }
      </rendition.Button>
    )
  }

  select () {
    this.props.onSelect(this.props.file)
  }
}

class UnstyledRecentFiles extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      recent: [],
      favorites: []
    }
  }

  render () {
    return (
      <Flex className={ this.props.className }>
        <h5>Recent</h5>
        {
          this.state.recent.map((file) => {
            <RecentFileLink key={ file.path }
              file={ file }
              onSelect={ this.props.selectFile }/>
          })
        }
        <h5>Favorite</h5>
        {
          this.state.favorites.map((file) => {
            <RecentFileLink key={ file.path }
              file={ file }
              onSelect={ this.props.navigate }/>
          })
        }
      </Flex>
    )
  }
}

const RecentFiles = styled(UnstyledRecentFiles)`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-start;
  width: 130px;
  background-color: ${ colors.secondary.background };
  padding: 20px;
  color: ${ colors.secondary.color };

  > h5 {
    color: ${ colors.secondary.title };
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: 15px;
  }

  > h5:last-of-type {
    margin-top: 20px;
  }

  > button {
    margin-bottom: 10px;
    text-align: start;
    font-size: 16px;
  }
`

module.exports = RecentFiles
