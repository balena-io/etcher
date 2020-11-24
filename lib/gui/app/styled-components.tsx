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

import * as _ from 'lodash';
import * as React from 'react';
import {
	Alert as AlertBase,
	Flex,
	FlexProps,
	Button,
	ButtonProps,
	Modal as ModalBase,
	Provider,
	Table as BaseTable,
	TableProps as BaseTableProps,
	Txt,
} from 'rendition';
import styled, { css } from 'styled-components';

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

export const Modal = styled(({ style, children, ...props }) => {
	return (
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
		>
			<ScrollableFlex flexDirection="column" width="100%" height="90%">
				{...children}
			</ScrollableFlex>
		</ModalBase>
	);
})`
	> div {
		padding: 0;
		height: 99%;

		> div:first-child {
			height: 81%;
			padding: 24px 30px 0;
		}

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
			padding: 0 30px;
			${modalFooterShadowCss}
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

export interface GenericTableProps<T> extends BaseTableProps<T> {
	refFn: (t: BaseTable<T>) => void;
	data: T[];
	checkedRowsNumber?: number;
	multipleSelection: boolean;
	showWarnings?: boolean;
}

const GenericTable: <T>(
	props: GenericTableProps<T>,
) => React.ReactElement<GenericTableProps<T>> = <T extends {}>({
	refFn,
	...props
}: GenericTableProps<T>) => (
	<div>
		<BaseTable<T> ref={refFn} {...props} />
	</div>
);

function StyledTable<T>() {
	return styled((props: GenericTableProps<T>) => (
		<GenericTable<T> {...props} />
	))`
		[data-display='table-head']
			> [data-display='table-row']
			> [data-display='table-cell'] {
			position: sticky;
			background-color: #f8f9fd;
			top: 0;
			z-index: 1;

			input[type='checkbox'] + div {
				display: ${(props) => (props.multipleSelection ? 'flex' : 'none')};

				${(props) =>
					props.multipleSelection &&
					props.checkedRowsNumber !== 0 &&
					props.checkedRowsNumber !== props.data.length
						? `
						font-weight: 600;
						color: ${colors.primary.foreground};
						background: ${colors.primary.background};

						::after {
							content: '–';
						}
						`
						: ''}
				}
			}
		}

		[data-display='table-head'] > [data-display='table-row'],
		[data-display='table-body'] > [data-display='table-row'] {
			> [data-display='table-cell']:first-child {
				padding-left: 15px;
				width: 6%;
			}

			> [data-display='table-cell']:last-child {
				padding-right: 0;
			}
		}

		[data-display='table-body'] > [data-display='table-row'] {
			&:nth-of-type(2n) {
				background: transparent;
			}

			&[data-highlight='true'] {
				&.system {
					background-color: ${(props) => (props.showWarnings ? '#fff5e6' : '#e8f5fc')};
				}

				> [data-display='table-cell']:first-child {
					box-shadow: none;
				}
			}
		}

		&& [data-display='table-row'] > [data-display='table-cell'] {
			padding: 6px 8px;
			color: #2a506f;
		}

		input[type='checkbox'] + div {
			border-radius: ${(props) => (props.multipleSelection ? '4px' : '50%')};
		}
	`;
}

export const Table = <T extends {}>(props: GenericTableProps<T>) => {
	const TypedStyledFunctional = StyledTable<T>();
	return <TypedStyledFunctional {...props} />;
};
