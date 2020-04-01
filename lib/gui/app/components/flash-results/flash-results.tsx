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

import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import { left, position, space, top } from 'styled-system';

import { progress } from '../../../../shared/messages';
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
	results: { devices: { failed: number; successful: number } };
}) {
	return (
		<Div position="absolute" left="153px" top="66px">
			<div className="inline-flex title">
				<span className="tick tick--success space-right-medium"></span>
				<h3>Flash Complete!</h3>
			</div>
			<Div className="results" mt="11px" mr="0" mb="0" ml="40px">
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
			</Div>
		</Div>
	);
}
