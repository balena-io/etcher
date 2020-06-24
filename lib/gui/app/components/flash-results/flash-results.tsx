/*
 * Copyright 2019 balena.io
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

import CircleSvg from '@fortawesome/fontawesome-free/svgs/solid/circle.svg';
import CheckCircleSvg from '@fortawesome/fontawesome-free/svgs/solid/check-circle.svg';
import * as _ from 'lodash';
import outdent from 'outdent';
import * as React from 'react';
import { Flex, FlexProps, Link, Table, TableColumn, Txt } from 'rendition';
import styled from 'styled-components';

import { progress } from '../../../../shared/messages';
import { bytesToMegabytes } from '../../../../shared/units';

import FlashSvg from '../../../assets/flash.svg';
import { middleEllipsis } from '../../utils/middle-ellipsis';
import { Modal } from '../../styled-components';

const ErrorsTable = styled(({ refFn, ...props }) => {
	return (
		<div>
			<Table<FlashError> ref={refFn} {...props} />
		</div>
	);
})`
	[data-display='table-head'] [data-display='table-cell'] {
		width: 50%;
		position: sticky;
		top: 0;
		background-color: ${(props) => props.theme.colors.quartenary.light};
	}

	[data-display='table-cell']:first-child {
		padding-left: 15px;
	}

	[data-display='table-cell']:last-child {
		width: 150px;
	}

	&& [data-display='table-row'] > [data-display='table-cell'] {
		padding: 6px 8px;
		color: #2a506f;
	}
`;
const DoneIcon = (props: {
	skipped: boolean;
	color: string;
	allFailed: boolean;
}) => {
	const svgProps = {
		width: '28px',
		fill: props.color,
		style: {
			marginTop: '-25px',
			marginLeft: '13px',
			zIndex: 1,
			color: props.color,
		},
	};
	return props.allFailed && !props.skipped ? (
		<TimesCircleSvg {...svgProps} />
	) : (
		<CheckCircleSvg {...svgProps} />
	);
};

interface FlashError extends Error {
	description: string;
	device: string;
	code: string;
}

function formattedErrors(errors: FlashError[]) {
	return errors
		.map((error) => `${error.device}: ${error.message || error.code}`)
		.join('\n');
}

const columns: Array<TableColumn<FlashError>> = [
	{
		field: 'description',
		label: 'Target',
	},
	{
		field: 'device',
		label: 'Location',
	},
	{
		field: 'message',
		label: 'Error',
		render: (message: string, { code }: FlashError) => {
			return message ? message : code;
		},
	},
];

export function FlashResults({
	image = '',
	errors,
	results,
	...props
}: {
	image?: string;
	errors: FlashError[];
	results: {
		bytesWritten: number;
		sourceMetadata: {
			size: number;
			blockmappedSize: number;
		};
		averageFlashingSpeed: number;
		devices: { failed: number; successful: number };
	};
} & FlexProps) {
	const [showErrorsInfo, setShowErrorsInfo] = React.useState(false);
	const allFailed = results.devices.successful === 0;
	const someFailed = results.devices.failed !== 0;
	const effectiveSpeed = _.round(
		bytesToMegabytes(
			results.sourceMetadata.size /
				(results.bytesWritten / results.averageFlashingSpeed),
		),
		1,
	);
	return (
		<Flex flexDirection="column" {...props}>
			<Flex alignItems="center" flexDirection="column">
				<Flex
					alignItems="center"
					mt="50px"
					mb="32px"
					color="#7e8085"
					flexDirection="column"
				>
					<FlashSvg width="40px" height="40px" className="disabled" />
					<DoneIcon
						skipped={skip}
						allFailed={allFailed}
						color={allFailed || someFailed ? '#c6c8c9' : '#1ac135'}
					/>
					<Txt>{middleEllipsis(image, 16)}</Txt>
				</Flex>
				<Txt fontSize={24} color="#fff" mb="17px">
					Flash Complete!
				</Txt>
				{skip ? <Txt color="#7e8085">Validation has been skipped</Txt> : null}
			</Flex>
			<Flex flexDirection="column" color="#7e8085">
				{Object.entries(results.devices).map(([type, quantity]) => {
					const failedTargets = type === 'failed';
					return quantity ? (
						<Flex alignItems="center">
							<CircleSvg
								width="14px"
								fill={type === 'failed' ? '#ff4444' : '#1ac135'}
								color={failedTargets ? '#ff4444' : '#1ac135'}
							/>
							<Txt ml="10px" color="#fff">
								{quantity}
							</Txt>
							<Txt
								ml="10px"
								tooltip={failedTargets ? formattedErrors(errors) : undefined}
							>
								{progress[type](quantity)}
							</Txt>
							{failedTargets && (
								<Link ml="10px" onClick={() => setShowErrorsInfo(true)}>
									more info
								</Link>
							)}
						</Flex>
					) : null;
				})}
				{!allFailed && (
					<Txt
						fontSize="10px"
						style={{
							fontWeight: 500,
							textAlign: 'center',
						}}
						tooltip={outdent({ newline: ' ' })`
							The speed is calculated by dividing the image size by the flashing time.
							Disk images with ext partitions flash faster as we are able to skip unused parts.
						`}
					>
						Effective speed: {effectiveSpeed} MB/s
					</Txt>
				)}
			</Flex>

			{showErrorsInfo && (
				<Modal
					titleElement={
						<Flex alignItems="baseline" mb={18}>
							<Txt fontSize={24} align="left">
								Failed targets
							</Txt>
						</Flex>
					}
					done={() => setShowErrorsInfo(false)}
				>
					<ErrorsTable columns={columns} data={errors} />
				</Modal>
			)}
		</Flex>
	);
}
