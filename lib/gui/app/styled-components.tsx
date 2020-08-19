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
	Flex,
	FlexProps,
	Button,
	ButtonProps,
	Modal as ModalBase,
	Provider,
	Txt,
	Theme as renditionTheme,
} from 'rendition';
import styled from 'styled-components';
import { space } from 'styled-system';

import { colors, theme } from './theme';

const defaultTheme = {
	...renditionTheme,
	...theme,
	layer: {
		extend: () => `
			> div:first-child {
				background-color: transparent;
			}
		`,
	},
};

export const ThemedProvider = (props: any) => (
	<Provider theme={defaultTheme} {...props}></Provider>
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

export const Footer = styled(Txt)`
	margin-top: 10px;
	color: ${colors.dark.disabled.foreground};
	font-size: 10px;
`;

export const DetailsText = (props: FlexProps) => (
	<Flex
		alignItems="center"
		color={colors.dark.disabled.foreground}
		{...props}
	/>
);

export const Modal = styled(({ style, ...props }) => {
	return (
		<Provider
			theme={{
				...defaultTheme,
				header: {
					height: '50px',
				},
				layer: {
					extend: () => `
					${defaultTheme.layer.extend()}

					> div:last-child {
						top: 0;
					}
				`,
				},
			}}
		>
			<ModalBase
				position="top"
				width="96vw"
				cancelButtonProps={{
					style: {
						marginRight: '20px',
						border: 'solid 1px #2a506f',
					},
				}}
				style={{
					height: '86.5vh',
					...style,
				}}
				{...props}
			/>
		</Provider>
	);
})`
	> div {
		padding: 24px 30px;
		height: calc(100% - 80px);

		::-webkit-scrollbar {
			display: none;
		}

		> h3 {
			margin: 0;
		}

		> div:last-child {
			border-radius: 0 0 7px 7px;
			height: 80px;
			background-color: #fff;
			justify-content: center;
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			box-shadow: 0 -2px 10px 0 rgba(221, 225, 240, 0.5), 0 -1px 0 0 #dde1f0;
		}
	}
`;

export const ScrollableFlex = styled(Flex)`
	overflow: auto;

	::-webkit-scrollbar {
		display: none;
	}

	> div > div {
		/* This is required for the sticky table header in TargetsTable */
		overflow-x: visible;
	}
`;
