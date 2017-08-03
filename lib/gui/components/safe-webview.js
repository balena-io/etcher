/*
 * Copyright 2017 resin.io
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

/* eslint-disable jsdoc/require-example */

const _ = require('lodash')
const electron = require('electron')
const angular = require('angular')
const react = require('react')
const propTypes = require('prop-types')
const react2angular = require('react2angular').react2angular
const analytics = require('../modules/analytics')
const packageJSON = require('../../../package.json')
const robot = require('../../shared/robot')

const MODULE_NAME = 'Etcher.Components.SafeWebview'
const angularSafeWebview = angular.module(MODULE_NAME, [])

/**
 * @summary Electron session identifier
 * @constant
 * @private
 * @type {String}
 */
const ELECTRON_SESSION = 'persist:success-banner'

/**
 * @summary Etcher version search-parameter key
 * @constant
 * @private
 * @type {String}
 */
const ETCHER_VERSION_PARAM = 'etcher-version'

/**
 * @summary API version search-parameter key
 * @constant
 * @private
 * @type {String}
 */
const API_VERSION_PARAM = 'api-version'

/**
 * @summary Webview API version
 * @constant
 * @private
 * @type {String}
 *
 * @description
 * Changing this number represents a departure from an older API and as such
 * should only be changed when truly necessary as it introduces breaking changes.
 * This version number is exposed to the banner such that it can determine what
 * features are safe to utilize.
 */
const API_VERSION = 1

/**
 * @summary Webviews that hide/show depending on the HTTP status returned
 * @type {Object}
 * @public
 *
 * @example
 * <safe-webview src="https://etcher.io/"></safe-webview>
 */
class SafeWebview extends react.PureComponent {
  /**
   * @param {Object} props - React element properties
   */
  constructor (props) {
    super(props)

    this.state = {
      shouldShow: true
    }

    const url = new window.URL(props.src)

    // We set the version GET parameters here.
    url.searchParams.set(ETCHER_VERSION_PARAM, packageJSON.version)
    url.searchParams.set(API_VERSION_PARAM, API_VERSION)

    this.entryHref = url.href

    // Events steal 'this'
    this.didFailLoad = _.bind(this.didFailLoad, this)
    this.didGetResponseDetails = _.bind(this.didGetResponseDetails, this)

    this.eventTuples = [
      [ 'did-fail-load', this.didFailLoad ],
      [ 'did-get-response-details', this.didGetResponseDetails ],
      [ 'new-window', this.constructor.newWindow ],
      [ 'console-message', this.constructor.consoleMessage ]
    ]

    // Make a persistent electron session for the webview
    electron.remote.session.fromPartition(ELECTRON_SESSION, {

      // Disable the cache for the session such that new content shows up when refreshing
      cache: false
    })
  }

  /**
   * @returns {react.Element}
   */
  render () {
    return react.createElement('webview', {
      ref: 'webview',
      style: {
        flex: this.state.shouldShow ? null : '0 1',
        width: this.state.shouldShow ? null : '0',
        height: this.state.shouldShow ? null : '0'
      }
    }, [])
  }

  /**
   * @summary Add the Webview events
   */
  componentDidMount () {
    // Events React is unaware of have to be handled manually
    _.map(this.eventTuples, (tuple) => {
      this.refs.webview.addEventListener(...tuple)
    })

    // Use the 'success-banner' session
    this.refs.webview.partition = ELECTRON_SESSION

    // It's important that this comes after the partition setting, otherwise it will
    // use another session and we can't change it without destroying the element again
    this.refs.webview.src = this.entryHref
  }

  /**
   * @summary Remove the Webview events
   */
  componentWillUnmount () {
    // Events that React is unaware of have to be handled manually
    _.map(this.eventTuples, (tuple) => {
      this.refs.webview.removeEventListener(...tuple)
    })
  }

  /**
   * @summary Refresh the webview if we are navigating away from the success page
   * @param {Object} nextProps - upcoming properties
   */
  componentWillReceiveProps (nextProps) {
    if (nextProps.refreshNow && !this.props.refreshNow) {
      // Reload the page if it hasn't changed, otherwise reset the source URL,
      // because reload interferes with 'src' setting, resetting the 'src' attribute
      // to what it was was just prior.
      if (this.refs.webview.src === this.entryHref) {
        this.refs.webview.reload()
      } else {
        this.refs.webview.src = this.entryHref
      }

      this.setState({
        shouldShow: true
      })
    }
  }

  /**
   * @summary Set the element state to hidden
   */
  didFailLoad () {
    this.setState({
      shouldShow: false
    })
  }

  /**
   * @summary Set the element state depending on the HTTP response code
   * @param {Event} event - Event object
   */
  didGetResponseDetails (event) {
    const HTTP_OK = 200
    const HTTP_ERR = 400

    this.setState({
      shouldShow: event.httpResponseCode >= HTTP_OK && event.httpResponseCode < HTTP_ERR
    })
  }

  /**
   * @summary Open link in browser if it's opened as a 'foreground-tab'
   * @param {Event} event - event object
   */
  static newWindow (event) {
    const url = new window.URL(event.url)

    if (_.every([
      url.protocol === 'http:' || url.protocol === 'https:',
      event.disposition === 'foreground-tab'
    ])) {
      electron.shell.openExternal(url.href)
    }
  }

  /**
   * @summary Forward specially-formatted console messages from the webview
   * @param {Event} event - event object
   *
   * @example
   *
   * // In the webview
   * console.log(JSON.stringify({
   *   command: 'error',
   *   data: 'Good night!'
   * }));
   *
   * console.log(JSON.stringify({
   *   command: 'log',
   *   data: 'Hello, Mars!'
   * }));
   */
  static consoleMessage (event) {
    if (!robot.isMessage(event.message)) {
      return
    }

    const message = robot.parseMessage(event.message)

    if (robot.getCommand(message) === robot.COMMAND.LOG) {
      analytics.logEvent(robot.getData(message))
    } else if (robot.getCommand(message) === robot.COMMAND.ERROR) {
      analytics.logException(robot.getData(message))
    }
  }
}

SafeWebview.propTypes = {

  /**
   * @summary The website source URL
   */
  src: propTypes.string.isRequired,

  /**
   * @summary Refresh the webview
   */
  refreshNow: propTypes.bool

}

angularSafeWebview.component('safeWebview', react2angular(SafeWebview))

module.exports = MODULE_NAME
