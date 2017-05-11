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
 * @summary Webviews that time out
 * @type {Object}
 * @public
 */
class SafeWebview extends react.PureComponent {

  /**
   * @param {Object} props - React element properties
   */
  constructor(props) {
    super(props);

    /**
     * @summary Loading timeout ID
     * @type Number
     * @public
     */
    this.loadingTimeoutId = null;
    this.state = {
      shouldLoad: true
    };

    // Events steal 'this'
    this.didStartLoading = _.bind(this.didStartLoading, this);
    this.didFailLoad = _.bind(this.didFailLoad, this);
    this.didStopLoading = _.bind(this.didStopLoading, this);
    this.didGetResponseDetails = _.bind(this.didGetResponseDetails, this);
  }

  /**
   * @returns {react.Element}
   */
  render() {
    if (this.state.shouldLoad) {
      const url = new URL(this.props.src);

      // We set the 'etcher-version' GET parameter here.
      url.searchParams.set('etcher-version', packageJSON.version);

      return react.createElement('webview', {
        ref: 'webview',
        src: url.href,
        style: {

          // Hide/show the webview per the documented way
          // https://electron.atom.io/docs/api/webview-tag/#css-styling-notes
          flex: this.state.shouldLoad ? null : '0 1',
          width: this.state.shouldLoad ? null : '0',
          height: this.state.shouldLoad ? null : '0'
        }
      }, []);

    }

    // We have to return null explicitly, undefined is an error in React.
    return null;
  }

  /**
   * @summary Add the Webview events if there is an element
   */
  componentDidMount() {

    // There is no element to add events to if 'shouldLoad' is false.
    if (this.state.shouldLoad) {

      // Events React is unaware of have to be handled manually
      this.refs.webview.addEventListener('did-start-loading', this.didStartLoading);
      this.refs.webview.addEventListener('did-fail-load', this.didFailLoad);
      this.refs.webview.addEventListener('did-stop-loading', this.didStopLoading);
      this.refs.webview.addEventListener('did-get-response-details', this.didGetResponseDetails);
      this.refs.webview.addEventListener('new-window', this.constructor.newWindow);
      this.refs.webview.addEventListener('console-message', this.constructor.consoleMessage);
    }
  }

  /**
   * @summary Remove the Webview events if there is an element
   */
  componentWillUnmount() {

    // There is no element to remove events from if 'shouldLoad' is false.
    if (this.state.shouldLoad) {

      // Events React is unaware of have to be handled manually
      this.refs.webview.removeEventListener('did-start-loading', this.didStartLoading);
      this.refs.webview.removeEventListener('did-fail-load', this.didFailLoad);
      this.refs.webview.removeEventListener('did-stop-loading', this.didStopLoading);
      this.refs.webview.removeEventListener('did-get-response-details', this.didGetResponseDetails);
      this.refs.webview.removeEventListener('new-window', this.constructor.newWindow);
      this.refs.webview.removeEventListener('console-message', this.constructor.consoleMessage);
    }
  }

  /**
   * @summary Start the loading timeout timer
   */
  didStartLoading() {
    if (this.props.timeout) {
      this.loadingTimeoutId = setTimeout(() => {
        this.setState({
          shouldLoad: false
        });

      // Milliseconds to wait before cancelling the page-load.
      }, this.props.timeout);
    }
  }

  /**
   * @summary Set the element state to hidden
   */
  didFailLoad() {
    this.setState({
      shouldLoad: false
    });
  }

  /**
   * @summary Remove the timeout
   */
  didStopLoading() {

    // We have loaded, remove the queued timeout action.
    clearTimeout(this.loadingTimeoutId);
  }

  /**
   * @summary Set the element state depending on the HTTP response code
   * @param {Event} event - Event object
   */
  didGetResponseDetails(event) {
    const HTTP_OK = 200;

    if (event.httpResponseCode !== HTTP_OK) {
      this.setState({
        shouldLoad: false
      });
    }

  }

  /**
   * @param {Event} event - event object
   */
  static newWindow(event) {
    const url = new URL(event.url);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      electron.shell.openExternal(url.href);
    }
  }

  /**
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
   * @summary Execute the callback
   * @param {Object} props - element properties
   * @param {Object} state - component state
   */
  componentWillUpdate(props, state) {
    this.props.callback(state.shouldLoad);
  }

}

SafeWebview.propTypes = {
  src: propTypes.string.isRequired,
  timeout: propTypes.number,
  callback: propTypes.func
};

angularSafeWebview.component('safeWebview', react2angular(SafeWebview));

module.exports = MODULE_NAME;
