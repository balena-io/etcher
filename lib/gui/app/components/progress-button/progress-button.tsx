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
import { Button, Flex, ProgressBar, Txt } from 'rendition';
import { default as styled } from 'styled-components';

import { fromFlashState } from '../../modules/progress-status';
import { StepButton } from '../../styled-components';

const FlashProgressBar = styled(ProgressBar)`
	> div {
		width: 220px;
		height: 12px;
		color: white !important;
		text-shadow: none !important;
		transition-duration: 0s;
		> div {
			transition-duration: 0s;
		}
	}

	width: 220px;
	height: 12px;
	border-radius: 14px;
	font-size: 16px;
	line-height: 48px;

	background: #2f3033;
`;

interface ProgressButtonProps {
	type: 'decompressing' | 'flashing' | 'verifying';
	active: boolean;
	percentage: number;
	position: number;
	disabled: boolean;
	cancel: () => void;
	callback: () => void;
}

const colors = {
	decompressing: '#00aeef',
	flashing: '#da60ff',
	verifying: '#1ac135',
} as const;

const CancelButton = styled((props) => (
	<Button plain {...props}>
		Cancel
	</Button>
))`
	font-weight: 600;
	&&& {
		width: auto;
		height: auto;
		font-size: 14px;
	}
`;

export class ProgressButton extends React.PureComponent<ProgressButtonProps> {
	public render() {
		const { status, position } = fromFlashState({
			type: this.props.type,
			position: this.props.position,
			percentage: this.props.percentage,
		});
		if (this.props.active) {
			return (
				<div>
					<Flex justifyContent="space-between" style={{ fontWeight: 600 }}>
						<Flex>
							<Txt color="#fff">{status}&nbsp;</Txt>
							<Txt color={colors[this.props.type]}>{position}</Txt>
						</Flex>
						<CancelButton onClick={this.props.cancel} color="#00aeef" />
					</Flex>
					<FlashProgressBar
						background={colors[this.props.type]}
						value={this.props.percentage}
					/>
				</div>
			);
		}
		return (
			<StepButton
				primary
				onClick={this.props.callback}
				disabled={this.props.disabled}
			>
				Flash!
			</StepButton>
		);
	}
}
