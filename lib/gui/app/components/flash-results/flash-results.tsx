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

import { faCheckCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as _ from 'lodash';
import outdent from 'outdent';
import * as React from 'react';
import { Txt, Flex } from 'rendition';

import { progress } from '../../../../shared/messages';
import { bytesToMegabytes } from '../../../../shared/units';

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
		<Flex
			flexDirection="column"
			mr="80px"
			height="90px"
			style={{
				position: 'relative',
				top: '25px',
			}}
		>
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
			<Flex flexDirection="column" mr="0" mb="0" ml="40px" color="#7e8085">
				{Object.entries(results.devices).map(([type, quantity]) => {
					return quantity ? (
						<Flex
							alignItems="center"
							tooltip={type === 'failed' ? errors : undefined}
						>
							<FontAwesomeIcon
								color={type === 'failed' ? '#ff4444' : '#1ac135'}
								icon={faCircle}
							/>
							<Txt ml={10}>{quantity}</Txt>
							<Txt ml={10}>{progress[type](quantity)}</Txt>
						</Flex>
					) : null;
				})}
				{!allDevicesFailed && (
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
		</Flex>
	);
}
