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
import { Flex } from 'rendition/dist_esm5/components/Flex';
import { v4 as uuidV4 } from 'uuid';

import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import { Actions, store } from '../../models/store';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { FlashAnother } from '../flash-another/flash-another';
import { FlashResults } from '../flash-results/flash-results';

import EtcherSvg from '../../../assets/etcher.svg';
import LoveSvg from '../../../assets/love.svg';
import BalenaSvg from '../../../assets/balena.svg';

function restart(goToMain: () => void) {
	selectionState.deselectAllDrives();
	analytics.logEvent('Restart');

	// Reset the flashing workflow uuid
	store.dispatch({
		type: Actions.SET_FLASHING_WORKFLOW_UUID,
		data: uuidV4(),
	});

	goToMain();
}

function formattedErrors() {
	const errors = _.map(
		_.get(flashState.getFlashResults(), ['results', 'errors']),
		(error) => {
			return `${error.device}: ${error.message || error.code}`;
		},
	);
	return errors.join('\n');
}

function FinishPage({ goToMain }: { goToMain: () => void }) {
	const results = flashState.getFlashResults().results || {};
	return (
		<Flex flexDirection="column" width="100%" color="#fff">
			<Flex height="160px" alignItems="center" justifyContent="center">
				<FlashResults results={results} errors={formattedErrors()} />

				<FlashAnother
					onClick={() => {
						restart(goToMain);
					}}
				/>
			</Flex>

			<Flex
				flexDirection="column"
				height="320px"
				justifyContent="space-between"
				alignItems="center"
			>
				<Flex fontSize="28px" mt="40px">
					Thanks for using
					<EtcherSvg
						width="165px"
						style={{ margin: '0 10px', cursor: 'pointer' }}
						onClick={() =>
							openExternal('https://balena.io/etcher?ref=etcher_offline_banner')
						}
					/>
				</Flex>
				<Flex mb="10px">
					made with
					<LoveSvg height="20px" style={{ margin: '0 10px' }} />
					by
					<BalenaSvg
						height="20px"
						style={{ margin: '0 10px', cursor: 'pointer' }}
						onClick={() => openExternal('https://balena.io?ref=etcher_success')}
					/>
				</Flex>
			</Flex>
		</Flex>
	);
}

export default FinishPage;
