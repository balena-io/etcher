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
const Bluebird = require('bluebird')
const React = require('react')
const propTypes = require('prop-types')
const {
  Alert,
  Button,
  Container,
  DeleteButton,
  Divider,
  Heading,
  Input,
  Provider,
  Txt
} = require('rendition')
const styled = require('styled-components').default
const fontAwesome = require('@fortawesome/fontawesome')
const {
  faWifi,
  faLock,
  faWrench,
  faAngleLeft,
  faTimes
} = require('@fortawesome/fontawesome-free-solid')
const analytics = require('../../../modules/analytics')
const actions = require('./actions.js')
const KBInput = require('./keyboard/index.jsx')

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
      <Txt
        color={ props.toggle ? colors.divider : 'black' }
        bold={ !props.toggle }>Off</Txt>
      <label>
        <div></div>
        <input type="checkbox" onClick={ props.onClick } checked={ props.toggle } />
      </label>
      <Txt
        color={ props.toggle ? 'black' : colors.divider }
        bold={ props.toggle }>On</Txt>
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
    background-color: ${(props) => { return props.toggle ? props.primaryColor : props.secondaryColor }}
    cursor: pointer;
    transition: 0.1s all ease-out;
  }

  > label > div {
    width: 1em;
    height: 1em;
    border-radius: 1em;
    background-color: ${(props) => { return props.knobColor }};
    margin-left: ${(props) => { return props.toggle ? '0.8em' : '0' }};
    transition: 0.1s all ease-out;
  }

  > label > input {
    display: none;
  }
`

const ConnectionUnstyled = styled((props) => {
  const isOpen = _.get(props, [ 'connection', 'security' ]) === 'open'
  const configureButton = (
    <Button
      onClick={ () => { return props.configureConnection(props.connection) }}
      plaintext
      primary>
      <span dangerouslySetInnerHTML={ { __html: faWrenchHTML } } />
      <Txt bold>Configuration</Txt>
    </Button>
  )

  const labelElem = props.onClick
    ? (
      <Button
        onClick={ () => { return props.onClick(props.connection) }}
        bold={ props.selected }
        plaintext>
        { props.connection.ssid }
      </Button>
    )
    : (
      <Txt bold={ props.selected }>
        { props.connection.ssid }
      </Txt>
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
})
const Connection = ConnectionUnstyled `
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
    color: ${(props) => { return props.selected ? colors.activeGreen : null }};
  }

  > span:last-of-type,
  > button:first-of-type:not(:last-of-type),
  > div:first-of-type,
  > button:last-of-type {
    background-color: ${(props) => { return props.selected ? colors.activeGray : 'transparent' }};
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

const Header = styled.div `
  display: flex;
  justify-content: space-between;
  flex: 0 0 auto;
  margin: 20px 42px 35px 0;
`

const Main = styled.div `
  flex: 1;
`

const Footer = styled((props) => {
  return (
    <Container className={ props.className } align="center">
      <Button emphasized primary w={ 200 } onClick={ props.close }>{props.text || 'OK'}</Button>
    </Container>
  )
})`
  flex: 0 0 auto;
`

const Label = styled.label `
  margin: 30px 0.5em 12px 0;
  
  > div {
    margin-bottom: 10px;
    font-size: 11px;
    text-transform: uppercase;
  }
`

const Corner = styled.div `
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
      loading: true,
      page: 'list',
      isWifiEnabled: false,
      showPassphrase: false,
      currentNetwork: {},
      networkList: []
    }

    this.selectedEdit = {}
    this.browse = this.browse.bind(this)
    this.toggleWifi = this.toggleWifi.bind(this)
    this.togglePassphraseVisibility = this.togglePassphraseVisibility.bind(this)
  }

  render () {
    if (this.state.page === 'list') {
      return (
        <Provider style={ rootStyles }>
          <Header>
            <Heading.h3 bold>WiFi</Heading.h3>
            <ToggleButton
              toggle={ this.state.isWifiEnabled }
              onClick={ this.toggleWifi }
              primaryColor={ colors.activeGreen }
              secondaryColor={ colors.divider }
              knobColor={ 'white' }
            />
            <Corner>
              <DeleteButton onClick={ this.props.close } />
            </Corner>
          </Header>
          {!this.state.loading && this.state.isWifiEnabled && <Main>
            {!_.isEmpty(this.state.currentNetwork) && <div><Connection
              connection={ this.state.currentNetwork }
              selected
              configureConnection={ this.configureNetwork(this.state.currentNetwork).bind(this) } />
            <Divider color={ colors.divider } /></div> }
            <div>
              { _.chain(this.state.networkList)
                .reject({ ssid: this.state.currentNetwork.ssid })
                .map((connection) => {
                  return (
                    <Connection
                      onClick={ this.configureNetwork(connection).bind(this) }
                      connection={ connection } />
                  )
                }).value() }
            </div>
          </Main>}
          <Footer close={ this.props.close } text="Close"/>
        </Provider>
      )
    }

    if (this.state.page === 'configure') {
      return (
        <Provider style={ rootStyles }>
          <Header>
            <Button
              onClick={ _.partial(this.browse, 'list') }
              bg={ colors.activeGray }
              color={ colors.textBlack }>
              <span dangerouslySetInnerHTML={ { __html: faAngleLeftHTML } } />&nbsp;
              Back
            </Button>
            <Corner>
              <DeleteButton onClick={ this.props.close } />
            </Corner>
          </Header>
          <Main>
            <Heading.h4 bold>{ this.selectedEdit.ssid }</Heading.h4>
            <Label>
              <div>WIFI PASSPHRASE</div>
              <KBInput
                key="network-name"
                value={ this.selectedEdit.passphrase }
                type={ this.state.showPassphrase ? 'input' : 'password' }
                placeholder="Empty"
                onChange={(value) => {
                  if (!_.isEmpty(value) && value !== this.selectedEdit.passphrase) {
                    this.selectedEdit.passphrase = value
                    this.setState({ selectedEdit: _.assign({}, this.selectedEdit, { passphrase: value }) })
                  }
                }}/>
            </Label>
            <Button
              bg={ 'transparent' }
              color={ colors.divider }
              onClick={ this.togglePassphraseVisibility }
              plaintext>
              { this.state.showPassphrase ? 'Hide' : 'Show' }
            </Button>
            <Divider color={ colors.divider } />
            <Button danger plaintext onClick={this.forget(this.selectedEdit).bind(this)}>
              <span dangerouslySetInnerHTML={ { __html: faTimesHTML } } />&nbsp;
              Forget network
            </Button>
          </Main>
          <Footer close={this.closeConfiguration.bind(this)} />
        </Provider>
      )
    }

    return (<div></div>)
  }

  componentDidMount () {
    // Check if wifi is active
    actions.isActive()
      .then(this.handleWifiActive.bind(this))
      .catch((err) => {
        console.log('err :(((', err)
      })
  }

  handleWifiActive (active) {
    if (active) {
      this.setState({
        loading: false,
        isWifiEnabled: true,
      })
      Bluebird.all([
        actions.getNetworks(),
        actions.getCurrentNetwork()
      ])
        .then(this.handleNetworksList.bind(this))
        .catch(this.handleNetworksListError.bind(this))
    }
  }

  handleNetworksList ([ networkList, currentNetwork ]) {
    console.log('currentNetwork', _.uniqBy(currentNetwork, (n) => n.ssid))
    this.setState({
      networkList,
      currentNetwork: _.find(networkList, {ssid: currentNetwork.Id}) || {}
    })
    setTimeout(() => {
      return actions.getNetworks()
      .then((networks) => {
        return [networks, this.state.currentNetwork]
      })
      .then(this.handleNetworksList.bind(this))
      .catch(this.handleNetworksListError.bind(this))
    }, 5000)
  }

  handleNetworksListError (err) {
    /*
    Function to set error to the pertaining form control
    error(formControl, errorMessage)
    */
    this.setState({
      'x-error': err.message
    })
    console.log('err???', err)
  }

  toggleWifi () {
    const newState = !this.state.isWifiEnabled
    return actions.toggleWifi(newState)
      .then((active) => {
        analytics.logEvent('Wifi toggle', {
          isWifiEnabled: active
        })
        this.handleWifiActive(active)
      })
      .catch((err) => {
        // Handle errors
        console.log('err', err)
      })
  }

  connect (network) {
    return actions.connect(network)
      .then((success) => {
        if (success) {
          this.setState({
            currentNetwork: network
          })
        } else {
          console.log(`Could not connect to network ${network.ssid}`)
        }
      })
      .catch((err) => {
        console.log('err?', err)
      })
  }

  closeConfiguration () {
    return this.connect(this.selectedEdit)
      .then(() => {
        this.props.close()
      })
      .catch((err) => {
        console.log('err :(', err)
      })
  }

  browse (page) {
    analytics.logEvent('Wifi change page', {
      page
    })
    this.setState({ page })
  }

  forget (connection) {
    return () => {
      return actions.forget(connection)
        .then((success) => {
          const newState = {
            page: 'list'
          }
          if (this.state.currentNetwork.ssid === connection.ssid) {
            _.assign(newState, { currentNetwork: {} })
          }
          this.setState(newState)
        })
        .catch((err) => {
          console.log('err :/', err)
        })
    }
  }

  configureNetwork (network) {
    return () => {
      this.selectedEdit = network
      this.setState({
        page: 'configure'
      })
    }
  }

  togglePassphraseVisibility () {
    this.setState({ showPassphrase: !this.state.showPassphrase })
  }
}

Wifi.propTypes = {
  close: propTypes.function
}

module.exports = Wifi
