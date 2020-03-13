/*
 * Copyright 2018 balena.io
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
import {
	Button,
	ButtonProps,
	Flex,
	Modal as ModalBase,
	Provider,
	Txt,
} from 'rendition';
import styled from 'styled-components';
import { space } from 'styled-system';

import { colors, theme } from './theme';

export const ThemedProvider = (props: any) => (
	<Provider theme={theme} {...props}></Provider>
);

export const BaseButton = styled(Button)`
	width: 200px;
	height: 48px;
	font-size: 16px;
`;

export const IconButton = styled((props) => <Button plain {...props} />)`
	&&& {
		width: 24px;
		height: 24px;
		font-size: 24px;
		color: #fff;

		> svg {
			font-size: 1em;
		}
	}
`;

export const StepButton = styled((props: ButtonProps) => (
	<BaseButton {...props}></BaseButton>
))`
	color: #ffffff;
	margin: auto;
`;

export const ChangeButton = styled(Button)`
	&& {
		border-radius: 24px;
		color: ${colors.primary.background};
		padding: 0;
		height: 18px;
		font-size: 14px;

		&:enabled {
			&:hover,
			&:focus,
			&:active {
				color: #8f9297;
			}
		}
		${space}
	}
`;

export const StepNameButton = styled(BaseButton)`
	display: inline-flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	font-weight: bold;
	color: ${colors.dark.foreground};

	&:enabled {
		&:hover,
		&:focus,
		&:active {
			color: #8f9297;
		}
	}
`;

export const StepSelection = styled(Flex)`
	flex-wrap: wrap;
	justify-content: center;
`;

export const Footer = styled(Txt)`
	margin-top: 10px;
	color: ${colors.dark.disabled.foreground};
	font-size: 10px;
`;

export const Underline = styled(Txt.span)`
	border-bottom: 1px dotted;
	padding-bottom: 2px;
`;

export const DetailsText = styled(Txt.p)`
	color: ${colors.dark.disabled.foreground};
	margin-bottom: 0;
`;

export const Modal = styled((props) => {
	return (
		<ModalBase
			cancelButtonProps={{
				style: {
					marginRight: '20px',
					border: 'solid 1px #2a506f',
				},
			}}
			{...props}
		/>
	);
})`
	> div {
		padding: 30px;

		> div:last-child {
			height: 80px;
			justify-content: center;
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			box-shadow: 0 -2px 10px 0 rgba(221, 225, 240, 0.5), 0 -1px 0 0 #dde1f0;
		}
	}
`;
