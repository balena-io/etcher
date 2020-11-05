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

import * as React from 'react';
import { Flex } from 'rendition';
import { v4 as uuidV4 } from 'uuid';

import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import { Actions, store } from '../../models/store';
import * as analytics from '../../modules/analytics';
import { FlashAnother } from '../flash-another/flash-another';
import { FlashResults, FlashError } from '../flash-results/flash-results';
import { SafeWebview } from '../safe-webview/safe-webview';

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

function FinishPage({ goToMain }: { goToMain: () => void }) {
	const [webviewShowing, setWebviewShowing] = React.useState(false);
	const flashResults = flashState.getFlashResults();
	const errors: FlashError[] = (
		store.getState().toJS().failedDeviceErrors || []
	).map(([, error]: [string, FlashError]) => ({
		...error,
	}));
	const {
		averageSpeed,
		blockmappedSize,
		bytesWritten,
		failed,
		size,
	} = flashState.getFlashState();
	const {
		skip,
		results = {
			bytesWritten,
			sourceMetadata: {
				size,
				blockmappedSize,
			},
			averageFlashingSpeed: averageSpeed,
			devices: { failed, successful: 0 },
		},
	} = flashResults;
	return (
		<Flex height="100%" justifyContent="space-between">
			<Flex
				width={webviewShowing ? '36.2vw' : '100vw'}
				height="100vh"
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				style={{
					position: 'absolute',
					top: 0,
					zIndex: 1,
					boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.2)',
				}}
			>
				<FlashResults
					image={selectionState.getImage()?.name}
					results={results}
					skip={skip}
					errors={errors}
					mb="32px"
					goToMain={goToMain}
				/>

				<FlashAnother
					onClick={() => {
						restart(goToMain);
					}}
				/>
			</Flex>
			<SafeWebview
				src="https://www.balena.io/etcher/success-banner?borderTop=false&darkBackground=true"
				onWebviewShow={setWebviewShowing}
				style={{
					display: webviewShowing ? 'flex' : 'none',
					position: 'absolute',
					right: 0,
					bottom: 0,
					width: '63.8vw',
					height: '100vh',
				}}
			/>
		</Flex>
	);
}

export default FinishPage;
