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
import { ProgressBar } from 'rendition';
import { default as styled } from 'styled-components';

import { StepButton } from '../../styled-components';

const FlashProgressBar = styled(ProgressBar)`
	> div {
		width: 200px;
		height: 48px;
		color: white !important;
		text-shadow: none !important;
		transition-duration: 0s;
		> div {
			transition-duration: 0s;
		}
	}

	width: 200px;
	height: 48px;
	font-size: 16px;
	line-height: 48px;

	background: #2f3033;
`;

interface ProgressButtonProps {
	type: 'decompressing' | 'flashing' | 'verifying';
	active: boolean;
	percentage: number;
	label: string;
	disabled: boolean;
	callback: () => void;
}

const colors = {
	decompressing: '#00aeef',
	flashing: '#da60ff',
	verifying: '#1ac135',
} as const;

export class ProgressButton extends React.PureComponent<ProgressButtonProps> {
	public render() {
		if (this.props.active) {
			return (
				<FlashProgressBar
					background={colors[this.props.type]}
					value={this.props.percentage}
				>
					{this.props.label}
				</FlashProgressBar>
			);
		}
		return (
			<StepButton
				primary
				onClick={this.props.callback}
				disabled={this.props.disabled}
			>
				{this.props.label}
			</StepButton>
		);
	}
}
