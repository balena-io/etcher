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

import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as _ from 'lodash';
import outdent from 'outdent';
import * as React from 'react';
import { Txt, Flex } from 'rendition';
import styled from 'styled-components';
import { left, position, space, top } from 'styled-system';

import { progress } from '../../../../shared/messages';
import { bytesToMegabytes } from '../../../../shared/units';
import { Underline } from '../../styled-components';

const Div = styled.div<any>`
  ${position}
  ${top}
  ${left}
  ${space}
`;

export function FlashResults({
	errors,
	results,
}: {
	errors: string;
	results: {
		bytesWritten: number;
		sourceMetadata: {
			size: number;
			blockmappedSize: number;
		};
		averageFlashingSpeed: number;
		devices: { failed: number; successful: number };
	};
}) {
	const allDevicesFailed = results.devices.successful === 0;
	const effectiveSpeed = _.round(
		bytesToMegabytes(
			results.sourceMetadata.size /
				(results.bytesWritten / results.averageFlashingSpeed),
		),
		1,
	);
	return (
		<Div position="absolute" left="153px" top="66px">
			<Flex alignItems="center">
				<FontAwesomeIcon
					icon={faCheckCircle}
					color={allDevicesFailed ? '#c6c8c9' : '#1ac135'}
					style={{
						width: '24px',
						height: '24px',
						margin: '0 15px 0 0',
					}}
				/>
				<Txt fontSize={24} color="#fff">
					Flash Complete!
				</Txt>
			</Flex>
			<Div className="results" mr="0" mb="0" ml="40px">
				{_.map(results.devices, (quantity, type) => {
					return quantity ? (
						<Underline
							tooltip={type === 'failed' ? errors : undefined}
							key={type}
						>
							<div
								key={type}
								className={`target-status-line target-status-${type}`}
							>
								<span className="target-status-dot"></span>
								<span className="target-status-quantity">{quantity}</span>
								<span className="target-status-message">
									{progress[type](quantity)}
								</span>
							</div>
						</Underline>
					) : null;
				})}
				{!allDevicesFailed && (
					<Txt
						color="#787c7f"
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
			</Div>
		</Div>
	);
}
