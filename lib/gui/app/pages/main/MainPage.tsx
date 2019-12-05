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

import * as path from 'path';
import * as React from 'react';
import * as FeaturedProject from '../../components/featured-project/featured-project';
import * as ImageSelector from '../../components/image-selector/image-selector';
import * as ReducedFlashingInfos from '../../components/reduced-flashing-infos/reduced-flashing-infos';
import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import * as store from '../../models/store';
import { ThemedProvider } from '../../styled-components';
import * as middleEllipsis from '../../utils/middle-ellipsis';

import * as messages from '../../../../shared/messages';
import { bytesToClosestUnit } from '../../../../shared/units';

import * as DriveSelector from './DriveSelector';
import * as Flash from './Flash';

const getDrivesTitle = (selection: any) => {
	const drives = selection.getSelectedDrives();

	if (drives.length === 1) {
		return drives[0].description || 'Untitled Device';
	}

	if (drives.length === 0) {
		return 'No targets found';
	}

	return `${drives.length} Targets`;
};

const getImageBasename = (selection: any) => {
	if (!selection.hasImage()) {
		return '';
	}

	const selectionImageName = selection.getImageName();
	const imageBasename = path.basename(selection.getImagePath());
	return selectionImageName || imageBasename;
};

const MainPage = ({ DriveSelectorService, $timeout, $state }: any) => {
	const setRefresh = React.useState(false)[1];
	const [isWebviewShowing, setIsWebviewShowing] = React.useState(false);
	React.useEffect(() => {
		return (store as any).observe(() => {
			setRefresh(ref => !ref);
		});
	}, []);

	const setWebviewShowing = (isShowing: boolean) => {
		setIsWebviewShowing(isShowing);
		store.dispatch({
			type: 'SET_WEBVIEW_SHOWING_STATUS',
			data: Boolean(isShowing),
		});
	};

	const isFlashing = flashState.isFlashing();
	const shouldDriveStepBeDisabled = !selectionState.hasImage();
	const shouldFlashStepBeDisabled =
		!selectionState.hasDrive() || shouldDriveStepBeDisabled;
	const hasDrive = selectionState.hasDrive();
	const imageLogo = selectionState.getImageLogo();
	const imageSize = bytesToClosestUnit(selectionState.getImageSize());
	const imageName = middleEllipsis(getImageBasename(selectionState), 16);
	const driveTitle = middleEllipsis(getDrivesTitle(selectionState), 16);
	const shouldShowFlashingInfos = isFlashing && isWebviewShowing;
	const lastFlashErrorCode = flashState.getLastFlashErrorCode;
	const progressMessage = messages.progress;

	return (
		<ThemedProvider style={{ display: 'flex', height: '100%' }}>
			<div className="page-main row around-xs">
				<div className="col-xs">
					<ImageSelector flashing={isFlashing} />
				</div>

				<div className="col-xs">
					<DriveSelector
						DriveSelectorService={DriveSelectorService}
						webviewShowing={isWebviewShowing}
						disabled={shouldDriveStepBeDisabled}
						nextStepDisabled={shouldFlashStepBeDisabled}
						hasDrive={hasDrive}
						flashing={isFlashing}
					/>
				</div>

				{isFlashing && (
					<div>
						<FeaturedProject
							className={
								isFlashing && isWebviewShowing ? 'fp-visible' : undefined
							}
							onWebviewShow={setWebviewShowing}
						/>
					</div>
				)}

				<div>
					<ReducedFlashingInfos
						imageLogo={imageLogo}
						imageName={imageName}
						imageSize={imageSize}
						driveTitle={driveTitle}
						shouldShow={shouldShowFlashingInfos}
					/>
				</div>

				<div className="col-xs">
					<Flash
						DriveSelectorService={DriveSelectorService}
						$timeout={$timeout}
						$state={$state}
						shouldFlashStepBeDisabled={shouldFlashStepBeDisabled}
						lastFlashErrorCode={lastFlashErrorCode}
						progressMessage={progressMessage}
					/>
				</div>
			</div>
		</ThemedProvider>
	);
};

export default MainPage;
