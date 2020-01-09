/*
 * Copyright 2017 balena.io
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
const react = require('react')
const propTypes = require('prop-types')
const analytics = require('../../modules/analytics')
const { store } = require('../../models/store')
const settings = require('../../models/settings')
const packageJSON = require('../../../../../package.json')

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
 * @summary Opt-out analytics search-parameter key
 * @constant
 * @private
 * @type {String}
 */
const OPT_OUT_ANALYTICS_PARAM = 'optOutAnalytics'

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
 *
 * See `git blame -L n` where n is the line below for the history of version changes.
 */
const API_VERSION = 2

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
    url.searchParams.set(OPT_OUT_ANALYTICS_PARAM, !settings.get('errorReporting'))

    this.entryHref = url.href

    // Events steal 'this'
    this.didFailLoad = _.bind(this.didFailLoad, this)
    this.didGetResponseDetails = _.bind(this.didGetResponseDetails, this)

    const logWebViewMessage = (event) => {
      console.log('Message from SafeWebview:', event.message)
    }

    this.eventTuples = [
      [ 'did-fail-load', this.didFailLoad ],
      [ 'new-window', this.constructor.newWindow ],
      [ 'console-message', logWebViewMessage ]
    ]

    // Make a persistent electron session for the webview
    this.session = electron.remote.session.fromPartition(ELECTRON_SESSION, {

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
      partition: ELECTRON_SESSION,
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

    this.session.webRequest.onCompleted(this.didGetResponseDetails)

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
    this.session.webRequest.onCompleted(null)
  }

  /**
   * @summary Set the element state to hidden
   */
  didFailLoad () {
    this.setState({
      shouldShow: false
    })
    if (this.props.onWebviewShow) {
      this.props.onWebviewShow(false)
    }
  }

  /**
   * @summary Set the element state depending on the HTTP response code
   * @param {Event} event - Event object
   */
  didGetResponseDetails (event) {
    // This seems to pick up all requests related to the webview,
    // only care about this event if it's a request for the main frame
    if (event.resourceType === 'mainFrame') {
      const HTTP_OK = 200

      analytics.logEvent('SafeWebview loaded', {
        event,
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      })

      this.setState({
        shouldShow: event.statusCode === HTTP_OK
      })
      if (this.props.onWebviewShow) {
        this.props.onWebviewShow(event.statusCode === HTTP_OK)
      }
    }
  }

  /**
   * @summary Open link in browser if it's opened as a 'foreground-tab'
   * @param {Event} event - event object
   */
  static newWindow (event) {
    const url = new window.URL(event.url)

    if (_.every([
      url.protocol === 'http:' || url.protocol === 'https:',
      event.disposition === 'foreground-tab',

      // Don't open links if they're disabled by the env var
      !settings.get('disableExternalLinks')
    ])) {
      electron.shell.openExternal(url.href)
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
  refreshNow: propTypes.bool,

  /**
   * @summary Webview lifecycle event
   */
  onWebviewShow: propTypes.func

}

module.exports = SafeWebview
