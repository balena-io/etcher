/*
 * Copyright 2018 resin.io
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

'use strict';

import * as _ from 'lodash';
import * as React from 'react';
import { Flex, Txt } from 'rendition';

/* eslint-disable no-inline-comments */

const FlashResults = ({ errors, results, message }: any) => {
	return (
		<Flex flexDirection='column'>
			<Txt tooltip={errors()} margin='auto'>
				{_.map(results.devices, (quantity, type) => {
					return quantity ? (
						<div
							key={type}
							className={`target-status-line target-status-${type}`}
						>
							<span className="target-status-dot"></span>
							<span className="target-status-quantity">{quantity}</span>
							<span className="target-status-message">
								{message[type](quantity)}
							</span>
						</div>
					) : null;
				})}
			</Txt>
		</Flex>
	);
};

export default FlashResults;
