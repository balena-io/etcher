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

import { capitalize } from 'lodash';
import * as React from 'react';
import { Button, Flex, ProgressBar, Txt } from 'rendition';
import { default as styled } from 'styled-components';

import { StepButton } from '../../styled-components';

const colors = {
	decompressing: '#00aeef',
	flashing: '#da60ff',
	verifying: '#1ac135',
} as const;

const FlashProgressBar = styled(ProgressBar)`
	width: 220px;
	height: 12px;
	border-radius: 14px;
	margin: 10px 0;
	background: #2f3033;

	> div {
		width: 220px;
		height: 12px;
		transition-duration: 0s;
		> div {
			transition-duration: 0s;
		}
	}
`;

export interface ProgressButtonProps {
	type: 'decompressing' | 'flashing' | 'verifying';
	active: boolean;
	percentage: number;
	label: {
		status:
			| 'starting'
			| 'decompressing'
			| 'flashing'
			| 'finishing'
			| 'flashed'
			| 'validating'
			| 'finishing'
			| 'failed';
		percentage?: number | string;
	};
	disabled: boolean;
	onCancel: () => void;
	callback: () => void;
	warning?: boolean;
}

const CancelButton = styled((props) => (
	<Button plain style={{ fontWeight: 600 }} {...props}>
		Cancel
	</Button>
))`
	&&& {
		width: auto;
		height: auto;
		font-size: 14px;
	}
`;

const ProgressStatusLabel = styled(
	({
		label,
		color,
	}: {
		label: ProgressButtonProps['label'];
		color: string | undefined;
	}) => {
		if (label.status === 'flashed') {
			return (
				<Txt>
					{label.percentage} {label.status}
				</Txt>
			);
		}
		return (
			<Flex>
				{capitalize(label.status)}...&nbsp;
				{!!label.percentage ? (
					<Txt color={color} style={{ fontWeight: 600 }}>
						{label.percentage}%
					</Txt>
				) : null}
			</Flex>
		);
	},
)`
	font-size: '16px';
	font-family: 'SourceSansPro';
`;

export class ProgressButton extends React.PureComponent<ProgressButtonProps> {
	public render() {
		const { active, label, onCancel, type, percentage, warning } = this.props;
		if (active) {
			if (label.status !== 'starting') {
				return (
					<Txt align="left" color="white">
						<Flex justifyContent="space-between">
							<ProgressStatusLabel label={label} color={colors[type]} />
							<CancelButton onClick={onCancel} color="#00aeef" />
						</Flex>
						<FlashProgressBar
							background={colors[type]}
							value={percentage}
						></FlashProgressBar>
					</Txt>
				);
			}
			return <StepButton primary>Starting...</StepButton>;
		}
		return (
			<StepButton
				primary={!warning}
				warning={warning}
				onClick={this.props.callback}
				disabled={this.props.disabled}
			>
				Flash!
			</StepButton>
		);
	}
}
