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

const _ = require('lodash')
const React = require('react')
const propTypes = require('prop-types')
const rendition = require('rendition')
const { default: styled } = require('styled-components')
const fontAwesome = require('@fortawesome/fontawesome')
const {
  faWifi,
  faLock,
  faWrench,
  faAngleLeft,
  faTimes
} = require('@fortawesome/fontawesome-free-solid')
const analytics = require('../../../modules/analytics')

/**
 * @summary Font awesome icon constants
 */
const faWifiHTML = fontAwesome.icon(faWifi).html.join('\n')
const faLockHTML = fontAwesome.icon(faLock).html.join('\n')
const faWrenchHTML = fontAwesome.icon(faWrench).html.join('\n')
const faAngleLeftHTML = fontAwesome.icon(faAngleLeft).html.join('\n')
const faTimesHTML = fontAwesome.icon(faTimes).html.join('\n')

const rootStyles = {
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 20px)',
  width: 'calc(100vw - 20px)',
  padding: '10px 20px',
  fontSize: '16px'
}

const colors = {
  activeGreen: '#4db313',
  activeGray: '#f0f3f7',
  divider: '#d5d5d5',
  textBlack: '#3a3c41'
}

const mockWifiCtrl = {
  disable: _.noop,
  enable: _.noop,
  connect: _.noop,
  remove: _.noop,
  disconnect: _.noop,
  getSavedConnections: _.constant([]),
  getAvailableConnections: _.constant([
    {
      ssid: 'resin_io',
      security: 'WPA-PSK'
    },
    {
      ssid: 'Thumbs Up 👍',
      security: 'open'
    },
    {
      ssid: 'Virgin Media',
      security: 'open'
    },
    {
      ssid: 'TALKTALK-69C360',
      security: 'WPA-PSK'
    }
  ]),
  getCurrentConnection: _.constant({
    ssid: 'resin_io',
    security: 'WPA-PSK'
  })
}

const ToggleButton = styled((props) => {
  return (
    <div className={ props.className }>
      <rendition.Txt
        color={ props.toggle ? colors.divider : 'black' }
        bold={ !props.toggle }>Off</rendition.Txt>
      <label>
        <div></div>
        <input type="checkbox" onClick={ props.onClick } checked={ props.toggle } />
      </label>
      <rendition.Txt
        color={ props.toggle ? 'black' : colors.divider }
        bold={ props.toggle }>On</rendition.Txt>
    </div>
  )
})`
  display: flex;

  > label {
    display: inline-flex;
    align-items: center;
    width: 2em;
    height: 1.2em;
    padding: 0.1em;
    margin: 0 6px;
    border-radius: 1.2em;
    background-color: ${ props => props.toggle ? props.primaryColor : props.secondaryColor }
    cursor: pointer;
    transition: 0.1s all ease-out;
  }

  > label > div {
    width: 1em;
    height: 1em;
    border-radius: 1em;
    background-color: ${ props => props.knobColor };
    margin-left: ${ props => props.toggle ? '0.8em' : '0' };
    transition: 0.1s all ease-out;
  }

  > label > input {
    display: none;
  }
`

const Connection = styled((props) => {
  const isOpen = _.get(props, [ 'connection', 'security' ]) === 'open'
  const configureButton = (
    <rendition.Button
      onClick={ () => props.configureConnection(props.connection) }
      plaintext
      primary>
      <span dangerouslySetInnerHTML={ { __html: faWrenchHTML } } />
      <rendition.Txt bold>Configuration</rendition.Txt>
    </rendition.Button>
  )

  const labelElem = props.onClick
    ? (
      <rendition.Button
        onClick={ () => props.onClick(props.connection) }
        bold={ props.selected }
        plaintext>
        { props.connection.ssid }
      </rendition.Button>
    )
    : (
      <rendition.Txt bold={ props.selected }>
        { props.connection.ssid }
      </rendition.Txt>
    )

  return (
    <div className={ props.className }>
      <span dangerouslySetInnerHTML={ { __html: faWifiHTML } } />
      <span
        style={ { opacity: isOpen ? '0' : '1' } }
        dangerouslySetInnerHTML={ { __html: faLockHTML } } />
      { labelElem }
      { props.selected ? configureButton : null }
    </div>
  )
})`
  display: flex;
  align-items: stretch;
  height: 30px;
  
  > * {
    display: flex;
    align-items: center;
  }
  
  > span {
    flex: 0 0 auto;
    padding: 0 7px;
  }

  > span:first-of-type {
    color: ${props => props.selected ? colors.activeGreen : null };
  }

  > span:last-of-type,
  > button:first-of-type:not(:last-of-type),
  > div:first-of-type,
  > button:last-of-type {
    background-color: ${ props => props.selected ? colors.activeGray : 'transparent' };
  }

  > span:first-of-type {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  > div:first-of-type,
  > button:last-of-type {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  > span:last-of-type {
    font-size: 0.8em;
  }

  &:first-of-type {
    margin-top: 0;
  }

  &:last-of-type {
    margin-bottom: 0;
  }

  > button:first-of-type:not(:last-of-type),
  > div:first-of-type {
    flex: 1;
    justify-content: flex-start;
  }

  > button:last-of-type {
    padding-right: 18px;
  }

  > button:last-of-type > span {
    padding-right: 10px;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  flex: 0 0 auto;
  margin: 20px 42px 35px 0;
`

const Main = styled.div`
  flex: 1;
`

const Footer = styled((props) => {
  return (
    <rendition.Container className={ props.className } align="center">
      <rendition.Button emphasized primary w={ 200 } onClick={ props.close }>OK</rendition.Button>
    </rendition.Container>
  )
})`
  flex: 0 0 auto;
`

const Label = styled.label`
  margin: 30px 0.5em 12px 0;
  
  > div {
    margin-bottom: 10px;
    font-size: 11px;
    text-transform: uppercase;
  }
`

const Corner = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;

  > button {
    font-size: 18px;
  }
`

class Wifi extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      page: 'list',
      isWifiEnabled: true,
      showPassphrase: false
    }

    this.browse = this.browse.bind(this)
    this.toggleWifi = this.toggleWifi.bind(this)
    this.togglePassphraseVisibility = this.togglePassphraseVisibility.bind(this)
  }

  render () {
    const currentConnection = mockWifiCtrl.getCurrentConnection()
    const connections = mockWifiCtrl.getAvailableConnections().filter((connection) => {
      return connection.ssid !== _.get(currentConnection, [ 'ssid' ])
    })

    if (this.state.page === 'list') {
      return (
        <rendition.Provider style={ rootStyles }>
          <Header>
            <rendition.Heading.h3 bold>WiFi</rendition.Heading.h3>
            <ToggleButton
              toggle={ this.state.isWifiEnabled }
              onClick={ this.toggleWifi }
              primaryColor={ colors.activeGreen }
              secondaryColor={ colors.divider }
              knobColor={ 'white' }
            />
            <Corner>
              <rendition.DeleteButton onClick={ this.props.close } />
            </Corner>
          </Header>
          <Main>
            <Connection
              connection={ currentConnection }
              selected
              configureConnection={ _.partial(this.browse, 'configure') } />
            <rendition.Divider color={ colors.divider } />
            <div> {
              connections.map((connection) => {
                return (
                  <Connection onClick={ this.connect } connection={ connection } />
                )
              })
            } </div>
          </Main>
          <Footer close={ this.props.close } />
        </rendition.Provider>
      )
    }

    if (this.state.page === 'configure') {
      return (
        <rendition.Provider style={ rootStyles }>
          <Header>
            <rendition.Button
              onClick={ _.partial(this.browse, 'list') }
              bg={ colors.activeGray }
              color={ colors.textBlack }>
              <span dangerouslySetInnerHTML={ { __html: faAngleLeftHTML } } />&nbsp;
              Back
            </rendition.Button>
            <Corner>
              <rendition.DeleteButton onClick={ this.props.close } />
            </Corner>
          </Header>
          <Main>
            <rendition.Heading.h4 bold>{ currentConnection.ssid }</rendition.Heading.h4>
            <Label>
              <div>WIFI PASSPHRASE</div>
              <rendition.Input
                type={ this.state.showPassphrase ? 'input' : 'password' }
                placeholder="Empty"
              />
            </Label>
            <rendition.Button
              bg={ 'transparent' }
              color={ colors.divider }
              onClick={ this.togglePassphraseVisibility }
              plaintext>
              { this.state.showPassphrase ? 'Hide' : 'Show' }
            </rendition.Button>
            <rendition.Divider color={ colors.divider } />
            <rendition.Button danger plaintext>
              <span dangerouslySetInnerHTML={ { __html: faTimesHTML } } />&nbsp;
              Forget network
            </rendition.Button>
          </Main>
          <Footer close={ this.props.close } />
        </rendition.Provider>
      )
    }
  }

  componentDidMount () {
    // - Check if WiFi is enabled
    // - Grab available connections
  }

  connect (connection) {
    mockWifiCtrl.connect(connection)
  }

  browse (page) {
    analytics.logEvent('Wifi change page', {
      page
    })
    this.setState({ page })
  }

  forget (connection) {
    mockWifiCtrl.disconnect(connection)
    mockWifiCtrl.remove(connection)
  }

  toggleWifi () {
    analytics.logEvent('Wifi toggle', {
      isWifiEnabled: !this.state.isWifiEnabled
    })

    if (this.state.isWifiEnabled) {
      mockWifiCtrl.disable()
    } else {
      mockWifiCtrl.enable()
    }

    this.setState({ isWifiEnabled: !this.state.isWifiEnabled })
  }

  togglePassphraseVisibility () {
    this.setState({ showPassphrase: !this.state.showPassphrase })
  }
}

Wifi.propTypes = {
  close: propTypes.function
}

module.exports = Wifi
