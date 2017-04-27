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

const react = require('react');
const propTypes = require('prop-types');

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
    this.didStartLoading = this.didStartLoading.bind(this);
    this.didFailLoad = this.didFailLoad.bind(this);
    this.didStopLoading = this.didStopLoading.bind(this);
    this.didGetResponseDetails = this.didGetResponseDetails.bind(this);
  }

  /**
   * @returns {react.Element}
   */
  render() {
    if (this.state.shouldLoad) {
      return react.createElement('webview', {
        ref: 'webview',
        src: this.props.src,
        style: {

          // Hide/show the webview per the documented way
          // https://electron.atom.io/docs/api/webview-tag/#css-styling-notes
          flex: this.state.shouldLoad ? null : '0 1',
          width: this.state.shouldLoad ? null : '0',
          height: this.state.shouldLoad ? null : '0'
        }
      }, []);

    }

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

    const {
      httpResponseCode
    } = event;
    const HTTP_OK = 200;

    if (httpResponseCode !== HTTP_OK) {
      this.setState({
        shouldLoad: false
      });
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

module.exports = SafeWebview;
