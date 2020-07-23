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
	Alert as AlertBase,
	Flex,
	FlexProps,
	Button,
	ButtonProps,
	Modal as ModalBase,
	Provider,
	Txt,
	Theme as renditionTheme,
} from 'rendition';
import styled, { css } from 'styled-components';

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
	font-size: 14px;
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
	}
`;

export const StepNameButton = styled(BaseButton)`
	display: inline-flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	font-weight: normal;
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

const modalFooterShadowCss = css`
	overflow: auto;
	background: 0, linear-gradient(rgba(255, 255, 255, 0), white 70%) 0 100%, 0,
		linear-gradient(rgba(255, 255, 255, 0), rgba(221, 225, 240, 0.5) 70%) 0 100%;
	background-repeat: no-repeat;
	background-size: 100% 40px, 100% 40px, 100% 8px, 100% 8px;

	background-repeat: no-repeat;
	background-color: white;
	background-size: 100% 40px, 100% 40px, 100% 8px, 100% 8px;
	background-attachment: local, local, scroll, scroll;
`;

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
				width="97vw"
				cancelButtonProps={{
					style: {
						marginRight: '20px',
						border: 'solid 1px #2a506f',
					},
				}}
				style={{
					height: '87.5vh',
					...style,
				}}
				{...props}
			/>
		</Provider>
	);
})`
	> div {
		padding: 0;
		height: 100%;

		> h3 {
			margin: 0;
			padding: 24px 30px 0;
			height: 14.3%;
		}

		> div:first-child {
			height: 81%;
			padding: 24px 30px 0;
		}

		> div:nth-child(2) {
			height: 61%;

			> div:not(.system-drive-alert) {
				padding: 0 30px;
				${modalFooterShadowCss}
			}
		}

		> div:last-child {
			margin: 0;
			flex-direction: ${(props) =>
				props.reverseFooterButtons ? 'row-reverse' : 'row'};
			border-radius: 0 0 7px 7px;
			height: 80px;
			background-color: #fff;
			justify-content: center;
			width: 100%;
		}

		::-webkit-scrollbar {
			display: none;
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

export const Alert = styled((props) => (
	<AlertBase warning emphasized {...props}></AlertBase>
))`
	position: fixed;
	top: -40px;
	left: 50%;
	transform: translate(-50%, 0px);
	height: 30px;
	min-width: 50%;
	padding: 0px;
	justify-content: center;
	align-items: center;
	font-size: 14px;
	background-color: #fca321;
	text-align: center;

	* {
		color: #ffffff;
	}

	> div:first-child {
		display: none;
	}
`;
