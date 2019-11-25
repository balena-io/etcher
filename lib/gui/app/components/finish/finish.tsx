/*
 * Copyright 2019 resin.io
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

// eslint-disable-next-line no-unused-vars
import * as _ from 'lodash';
import * as React from 'react';
import { Box, Provider } from 'rendition';
import uuidV4 from 'uuid/v4';
import * as messages from '../../../../shared/messages';
import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import * as store from '../../models/store';
import * as analytics from '../../modules/analytics';
import * as updateLock from '../../modules/update-lock';
import FlashAnother from '../flash-another/flash-another';
import FlashResults from '../flash-results/flash-results';

import './styles/_finish.scss';

const restart = (options: any, $state: any) => {
	if (!options.preserveImage) {
		selectionState.deselectImage();
	}
	selectionState.deselectAllDrives();
	analytics.logEvent(
		'Restart',
		_.assign(
			{
				applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
				flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
			},
			options,
		),
	);

	// Re-enable lock release on inactivity
	updateLock.resume();

	// Reset the flashing workflow uuid
	store.dispatch({
		type: 'SET_FLASHING_WORKFLOW_UUID',
		data: uuidV4(),
	});

	$state.go('main');
};

const formattedErrors = () => {
	const errors = _.map(
		_.get(flashState.getFlashResults(), ['results', 'errors']),
		error => {
			return `${error.device}: ${error.message || error.code}`;
		},
	);
	return errors.join('\n');
};

const FinishPage = ({ $state }: any) => {
	const results = flashState.getFlashResults().results || {};
	const progressMessage = messages.progress;
	return (
		<Provider>
			<div className="page-finish row around-xs">
				<div className="col-xs">
					<Box>
						<FlashResults
							results={results}
							message={progressMessage}
							errors={formattedErrors}
						/>

						<FlashAnother
							onClick={(options: any) => restart(options, $state)}
						/>
					</Box>
				</div>
			</div>
		</Provider>
	);
};

export default FinishPage;
