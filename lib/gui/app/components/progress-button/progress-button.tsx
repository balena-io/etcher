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

import * as Color from 'color';
import * as React from 'react';
import { ProgressBar } from 'rendition';
import { css, default as styled, keyframes } from 'styled-components';

import { StepButton, StepSelection } from '../../styled-components';
import { colors } from '../../theme';

const darkenForegroundStripes = 0.18;
const desaturateForegroundStripes = 0.2;
const progressButtonStripesForegroundColor = Color(colors.primary.background)
	.darken(darkenForegroundStripes)
	.desaturate(desaturateForegroundStripes)
	.string();

const desaturateBackgroundStripes = 0.05;
const progressButtonStripesBackgroundColor = Color(colors.primary.background)
	.desaturate(desaturateBackgroundStripes)
	.string();

const ProgressButtonStripes = keyframes`
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 20px 20px;
  }
`;

const ProgressButtonStripesRule = css`
	${ProgressButtonStripes} 1s linear infinite;
`;

const FlashProgressBar = styled(ProgressBar)`
	> div {
		width: 200px;
		height: 48px;
		color: white !important;
		text-shadow: none !important;
	}

	width: 200px;
	height: 48px;
	font-size: 16px;
	line-height: 48px;

	background: ${Color(colors.warning.background)
		.darken(darkenForegroundStripes)
		.string()};
`;

const FlashProgressBarValidating = styled(FlashProgressBar)`
	// Notice that we add 0.01 to certain gradient stop positions.
	// That workarounds a Chrome rendering issue where diagonal
	// lines look spiky.
	// See https://github.com/balena-io/etcher/issues/472

	background-image: -webkit-gradient(
		linear,
		0 0,
		100% 100%,
		color-stop(0.25, ${progressButtonStripesForegroundColor}),
		color-stop(0.26, ${progressButtonStripesBackgroundColor}),
		color-stop(0.5, ${progressButtonStripesBackgroundColor}),
		color-stop(0.51, ${progressButtonStripesForegroundColor}),
		color-stop(0.75, ${progressButtonStripesForegroundColor}),
		color-stop(0.76, ${progressButtonStripesBackgroundColor}),
		to(${progressButtonStripesBackgroundColor})
	);

	background-color: white;

	animation: ${ProgressButtonStripesRule};
	overflow: hidden;

	background-size: 20px 20px;
`;

interface ProgressButtonProps {
	striped: boolean;
	active: boolean;
	percentage: number;
	label: string;
	disabled: boolean;
	callback: () => any;
}

/**
 * Progress Button component
 */
export class ProgressButton extends React.Component<ProgressButtonProps> {
	public render() {
		if (this.props.active) {
			if (this.props.striped) {
				return (
					<StepSelection>
						<FlashProgressBarValidating
							primary
							emphasized
							value={this.props.percentage}
						>
							{this.props.label}
						</FlashProgressBarValidating>
					</StepSelection>
				);
			}

			return (
				<StepSelection>
					<FlashProgressBar warning emphasized value={this.props.percentage}>
						{this.props.label}
					</FlashProgressBar>
				</StepSelection>
			);
		}

		return (
			<StepSelection>
				<StepButton
					primary
					onClick={this.props.callback}
					disabled={this.props.disabled}
				>
					{this.props.label}
				</StepButton>
			</StepSelection>
		);
	}
}
