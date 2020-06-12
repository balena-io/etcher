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
import { default as styled } from 'styled-components';
import { color } from 'styled-system';

import { SVGIcon } from '../svg-icon/svg-icon';

import DriveSvg from '../../../assets/drive.svg';
import ImageSvg from '../../../assets/image.svg';

const Div = styled.div`
	position: absolute;
	top: 45px;
	left: 545px;

	> span.step-name {
		justify-content: flex-start;

		> span {
			margin-left: 10px;
		}

		> span:nth-child(2) {
			font-weight: 500;
		}

		> span:nth-child(3) {
			font-weight: 400;
			font-style: italic;
		}
	}

	.disabled {
		opacity: 0.4;
	}
`;

const Span = styled.span`
	${color}
`;

interface ReducedFlashingInfosProps {
	imageLogo: string;
	imageName: string;
	imageSize: string;
	driveTitle: string;
	shouldShow: boolean;
}

export class ReducedFlashingInfos extends React.Component<
	ReducedFlashingInfosProps
> {
	constructor(props: ReducedFlashingInfosProps) {
		super(props);
		this.state = {};
	}

	public render() {
		return this.props.shouldShow ? (
			<Div>
				<Span className="step-name">
					<SVGIcon
						disabled
						width="20px"
						contents={this.props.imageLogo}
						fallback={<ImageSvg className="disabled" width="20px" />}
					/>
					<Span>{this.props.imageName}</Span>
					<Span color="#7e8085">{this.props.imageSize}</Span>
				</Span>

				<Span className="step-name">
					<DriveSvg className="disabled" width="20px" />
					<Span>{this.props.driveTitle}</Span>
				</Span>
			</Div>
		) : null;
	}
}
