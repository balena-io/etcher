/*
 * Copyright 2016 balena.io
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

import * as React from 'react';

import * as settings from '../../models/settings';
import * as analytics from '../../modules/analytics';
import { SafeWebview } from '../safe-webview/safe-webview';

interface FeaturedProjectProps {
	shouldShow: boolean;
	onWebviewShow: (isWebviewShowing: boolean) => void;
	style?: React.CSSProperties;
}

interface FeaturedProjectState {
	endpoint: string | null;
}

export class FeaturedProject extends React.PureComponent<
	FeaturedProjectProps,
	FeaturedProjectState
> {
	constructor(props: FeaturedProjectProps) {
		super(props);
		this.state = {
			endpoint: null,
		};
	}

	public async componentDidMount() {
		try {
			const url = new URL(
				(await settings.get('featuredProjectEndpoint')) ||
					'https://assets.balena.io/etcher-featured/index.html',
			);
			url.searchParams.append('borderRight', 'false');
			url.searchParams.append('darkBackground', 'true');
			this.setState({ endpoint: url.toString() });
		} catch (error) {
			analytics.logException(error);
		}
	}

	public render() {
		return this.state.endpoint ? (
			<SafeWebview src={this.state.endpoint} {...this.props} />
		) : null;
	}
}
