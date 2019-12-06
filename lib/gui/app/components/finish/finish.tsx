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
import * as uuidV4 from 'uuid/v4';
import * as messages from '../../../../shared/messages';
import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import * as store from '../../models/store';
import * as analytics from '../../modules/analytics';
import * as updateLock from '../../modules/update-lock';
import * as FlashAnother from '../flash-another/flash-another';
import * as FlashResults from '../flash-results/flash-results';
import * as SVGIcon from '../svg-icon/svg-icon';

const restart = (options: any, $state: any) => {
	const {
		applicationSessionUuid,
		flashingWorkflowUuid,
	} = store.getState().toJS();
	if (!options.preserveImage) {
		selectionState.deselectImage();
	}
	selectionState.deselectAllDrives();
	analytics.logEvent('Restart', {
		...options,
		applicationSessionUuid,
		flashingWorkflowUuid,
	});

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

function FinishPage({ $state }: any) {
	const results = flashState.getFlashResults().results || {};
	const progressMessage = messages.progress;
	return (
		<div className="page-finish row around-xs">
			<div className="col-xs">
				<div className="box center">
					<FlashResults
						results={results}
						message={progressMessage}
						errors={formattedErrors}
					></FlashResults>

					<FlashAnother
						onClick={(options: any) => restart(options, $state)}
					></FlashAnother>
				</div>

				<div className="box center">
					<div className="fallback-banner">
						<div className="caption caption-big">
							Thanks for using
							<span os-open-external="https://etcher.io?ref=etcher_offline_banner">
								<SVGIcon
									paths={['../../assets/etcher.svg']}
									width="165px"
									height="auto"
								></SVGIcon>
							</span>
						</div>
						<div className="caption caption-small fallback-footer">
							made with
							<SVGIcon
								paths={['../../assets/love.svg']}
								width="auto"
								height="20px"
							></SVGIcon>
							by
							<span os-open-external="https://resin.io?ref=etcher_success">
								<SVGIcon
									paths={['../../assets/balena.svg']}
									width="auto"
									height="20px"
								></SVGIcon>
							</span>
							<div className="section-footer">
								<span
									className="caption caption-small footer-right"
									manifest-bind="version"
									os-open-external="https://github.com/resin-io/etcher/blob/master/CHANGELOG.md"
								></span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default FinishPage;
