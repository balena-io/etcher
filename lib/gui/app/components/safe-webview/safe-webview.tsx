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

import * as electron from 'electron';
import * as _ from 'lodash';
import * as React from 'react';

import * as packageJSON from '../../../../../package.json';
import * as settings from '../../models/settings';
import * as analytics from '../../modules/analytics';

/**
 * @summary Electron session identifier
 */
const ELECTRON_SESSION = 'persist:success-banner';

/**
 * @summary Etcher version search-parameter key
 */
const ETCHER_VERSION_PARAM = 'etcher-version';

/**
 * @summary API version search-parameter key
 */
const API_VERSION_PARAM = 'api-version';

/**
 * @summary Opt-out analytics search-parameter key
 */
const OPT_OUT_ANALYTICS_PARAM = 'optOutAnalytics';

/**
 * @summary Webview API version
 *
 * @description
 * Changing this number represents a departure from an older API and as such
 * should only be changed when truly necessary as it introduces breaking changes.
 * This version number is exposed to the banner such that it can determine what
 * features are safe to utilize.
 *
 * See `git blame -L n` where n is the line below for the history of version changes.
 */
const API_VERSION = '2';

interface SafeWebviewProps {
	// The website source URL
	src: string;
	// @summary Refresh the webview
	refreshNow?: boolean;
	// Webview lifecycle event
	onWebviewShow?: (isWebviewShowing: boolean) => void;
}

interface SafeWebviewState {
	shouldShow: boolean;
}

/**
 * @summary Webviews that hide/show depending on the HTTP status returned
 */
export class SafeWebview extends React.PureComponent<
	SafeWebviewProps,
	SafeWebviewState
> {
	private entryHref: string;
	private session: electron.Session;
	private webviewRef: React.RefObject<electron.WebviewTag>;

	constructor(props: SafeWebviewProps) {
		super(props);
		this.webviewRef = React.createRef();
		this.state = {
			shouldShow: true,
		};
		const url = new window.URL(this.props.src);
		// We set the version GET parameters here.
		url.searchParams.set(ETCHER_VERSION_PARAM, packageJSON.version);
		url.searchParams.set(API_VERSION_PARAM, API_VERSION);
		url.searchParams.set(
			OPT_OUT_ANALYTICS_PARAM,
			(!settings.get('errorReporting')).toString(),
		);
		this.entryHref = url.href;
		// Events steal 'this'
		this.didFailLoad = _.bind(this.didFailLoad, this);
		this.didGetResponseDetails = _.bind(this.didGetResponseDetails, this);
		// Make a persistent electron session for the webview
		this.session = electron.remote.session.fromPartition(ELECTRON_SESSION, {
			// Disable the cache for the session such that new content shows up when refreshing
			cache: false,
		});
	}

	private static logWebViewMessage(event: electron.ConsoleMessageEvent) {
		console.log('Message from SafeWebview:', event.message);
	}

	public render() {
		return (
			<webview
				ref={this.webviewRef}
				partition={ELECTRON_SESSION}
				style={{
					flex: this.state.shouldShow ? undefined : '0 1',
					width: this.state.shouldShow ? undefined : '0',
					height: this.state.shouldShow ? undefined : '0',
				}}
			/>
		);
	}

	// Add the Webview events
	public componentDidMount() {
		// Events React is unaware of have to be handled manually
		if (this.webviewRef.current !== null) {
			this.webviewRef.current.addEventListener(
				'did-fail-load',
				this.didFailLoad,
			);
			this.webviewRef.current.addEventListener(
				'new-window',
				SafeWebview.newWindow,
			);
			this.webviewRef.current.addEventListener(
				'console-message',
				SafeWebview.logWebViewMessage,
			);
			this.session.webRequest.onCompleted(this.didGetResponseDetails);
			// It's important that this comes after the partition setting, otherwise it will
			// use another session and we can't change it without destroying the element again
			this.webviewRef.current.src = this.entryHref;
		}
	}

	// Remove the Webview events
	public componentWillUnmount() {
		// Events that React is unaware of have to be handled manually
		if (this.webviewRef.current !== null) {
			this.webviewRef.current.removeEventListener(
				'did-fail-load',
				this.didFailLoad,
			);
			this.webviewRef.current.removeEventListener(
				'new-window',
				SafeWebview.newWindow,
			);
			this.webviewRef.current.removeEventListener(
				'console-message',
				SafeWebview.logWebViewMessage,
			);
		}
		this.session.webRequest.onCompleted(null);
	}

	// Set the element state to hidden
	public didFailLoad() {
		this.setState({
			shouldShow: false,
		});
		if (this.props.onWebviewShow) {
			this.props.onWebviewShow(false);
		}
	}

	// Set the element state depending on the HTTP response code
	public didGetResponseDetails(event: electron.OnCompletedListenerDetails) {
		// This seems to pick up all requests related to the webview,
		// only care about this event if it's a request for the main frame
		if (event.resourceType === 'mainFrame') {
			const HTTP_OK = 200;
			analytics.logEvent('SafeWebview loaded', { event });
			this.setState({
				shouldShow: event.statusCode === HTTP_OK,
			});
			if (this.props.onWebviewShow) {
				this.props.onWebviewShow(event.statusCode === HTTP_OK);
			}
		}
	}

	// Open link in browser if it's opened as a 'foreground-tab'
	public static newWindow(event: electron.NewWindowEvent) {
		const url = new window.URL(event.url);
		if (
			_.every([
				url.protocol === 'http:' || url.protocol === 'https:',
				event.disposition === 'foreground-tab',
				// Don't open links if they're disabled by the env var
				!settings.get('disableExternalLinks'),
			])
		) {
			electron.shell.openExternal(url.href);
		}
	}
}
