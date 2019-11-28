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
import { Box, Flex, Heading, Provider, Txt } from 'rendition';
import * as uuidV4 from 'uuid/v4';
import * as messages from '../../../../shared/messages';
import * as middleEllipsis from './../../utils/middle-ellipsis';
import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import * as store from '../../models/store';
import * as analytics from '../../modules/analytics';
import * as updateLock from '../../modules/update-lock';
import FlashAnother from '../flash-another/flash-another';
import FlashResults from '../flash-results/flash-results';
import * as SafeWebview from '../safe-webview/safe-webview';
import * as SvgIcon from '../svg-icon/svg-icon';

const useState: any = React.useState

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
	const [ showOnlineContent, setShowOnlineContent ] = useState(true)
	const results = flashState.getFlashResults().results || {};
	const progressMessage = messages.progress;
	return (
		<Provider style={{height:'100%',textAlign:'center'}}>
			<Flex style={{ height:'100%' }} color='white'>
				<Box flex='1' style={{
					boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 15px 0px',
					zIndex: 1,
					height: '100vh',
					width: (showOnlineContent) ? '35vw' : '100vw',
					position: 'fixed',
					left: '0',
					top: '0'
				}}>
					<Box>
						<Txt mt='122px' mb='30px'>
							<SvgIcon
								paths={[ '../../assets/flash.svg' ]}
							/>
							<Txt
								className="tick tick--success space-right-medium"
								style={{
									left: '-20px',
									top: '15px'
								}}>
							</Txt>
							<Txt mt='9px'>
								{middleEllipsis(selectionState.getImageName(), 20)}
							</Txt>
						</Txt>
						<Heading.h3 color='white' mb='17px'>Flash Complete!</Heading.h3>

						<FlashResults
							m='20px 55px'
							results={results}
							message={progressMessage}
							errors={formattedErrors}
						/>

						<FlashAnother
							style={{marginTop:'21px'}}
							onClick={(options: any) => restart(options, $state)}
						/>
					</Box>
				</Box>
				{showOnlineContent ? (
					<Box style={{
						height: '100vh',
						width: '65vw',
						position: 'fixed',
						right: '0',
						top: '0'
					}}>
						<SafeWebview
							src='https://www.balena.io/etcher/success-banner/'
							refreshNow={$state.previousName === 'success'}
							onWebviewShow={setShowOnlineContent}
						/>
					</Box>
				) : null}
			</Flex>
		</Provider>
	);
};

export default FinishPage;
