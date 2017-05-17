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

'use strict';

const _ = require('lodash');
const electron = require('electron');
const angular = require('angular');
const react = require('react');
const propTypes = require('prop-types');
const react2angular = require('react2angular').react2angular;
const analytics = require('../../modules/analytics');
const packageJSON = require('../../../../package.json');

const MODULE_NAME = 'Etcher.Components.SafeWebview';
const angularSafeWebview = angular.module(MODULE_NAME, []);

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
  constructor(props) {
    super(props);

    this.state = {
      shouldShow: true
    };

    // Events steal 'this'
    this.didFailLoad = _.bind(this.didFailLoad, this);
    this.didGetResponseDetails = _.bind(this.didGetResponseDetails, this);
  }

  /**
   * @returns {react.Element}
   */
  render() {
    return react.createElement('webview', {
      ref: 'webview',
      src: this.makeURL().href,
      style: {
        flex: this.state.shouldShow ? null : '0 1',
        width: this.state.shouldShow ? null : '0',
        height: this.state.shouldShow ? null : '0'
      }
    }, []);
  }

  /**
   * @summary Add the Webview events
   */
  componentDidMount() {

    // Events React is unaware of have to be handled manually
    this.refs.webview.addEventListener('did-fail-load', this.didFailLoad);
    this.refs.webview.addEventListener('did-get-response-details', this.didGetResponseDetails);
    this.refs.webview.addEventListener('new-window', this.constructor.newWindow);
    this.refs.webview.addEventListener('console-message', this.constructor.consoleMessage);
  }

  /**
   * @summary Refresh the webview if we are navigating away from the success page
   * @param {Object} nextProps - upcoming properties
   */
  componentWillReceiveProps(nextProps) {
    if (this.props.currentStateName === 'success' && nextProps.currentStateName !== 'success') {

      // Reset URL to initial
      this.refs.webview.src = this.makeURL().href;
      this.refs.webview.reload();

      this.setState({
        shouldShow: true
      });
    }
  }

  /**
   * @summary Remove the Webview events
   */
  componentWillUnmount() {

    // Events React is unaware of have to be handled manually
    this.refs.webview.removeEventListener('did-fail-load', this.didFailLoad);
    this.refs.webview.removeEventListener('did-get-response-details', this.didGetResponseDetails);
    this.refs.webview.removeEventListener('new-window', this.constructor.newWindow);
    this.refs.webview.removeEventListener('console-message', this.constructor.consoleMessage);
  }

  /**
   * @summary Set the element state to hidden
   */
  didFailLoad() {
    this.setState({
      shouldShow: false
    });
  }

  /**
   * @summary Set the element state depending on the HTTP response code
   * @param {Event} event - Event object
   */
  didGetResponseDetails(event) {
    const HTTP_OK = 200;
    const HTTP_ERR = 400;

    this.setState({
      shouldShow: event.httpResponseCode >= HTTP_OK && event.httpResponseCode < HTTP_ERR
    });
  }

  /**
   * @summary Open link in browser if it's opened as a 'foreground-tab'
   * @param {Event} event - event object
   */
  static newWindow(event) {
    const url = new URL(event.url);

    if (_.every([
      url.protocol === 'http:' || url.protocol === 'https:',
      event.disposition === 'foreground-tab'
    ])) {
      electron.shell.openExternal(url.href);
    }
  }

  /**
   * @summary Forward console messages from the webview to analytics module
   * @param {Event} event - event object
   */
  static consoleMessage(event) {
    const ERROR_LEVEL = 2;

    if (event.level < ERROR_LEVEL) {
      analytics.logEvent(event.message);

    } else if (event.level === ERROR_LEVEL) {
      analytics.logException(event.message);
    }
  }

  /**
   * @summary Parse the 'src' prop into an URL and append metadata as GET parameters
   * @function
   * @public
   *
   * @returns {URL} url object
   */
  makeURL() {
    const url = new URL(this.props.src);

    // We set the 'etcher-version' GET parameter here.
    url.searchParams.set('etcher-version', packageJSON.version);

    return url;
  }

}

SafeWebview.propTypes = {

  /**
   * @summary The website source URL
   */
  src: propTypes.string.isRequired,

  /**
   * @summary Current Angular $state name
   */
  currentStateName: propTypes.string

};

angularSafeWebview.component('safeWebview', react2angular(SafeWebview));

module.exports = MODULE_NAME;
