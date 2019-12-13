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

import { faCog, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as path from 'path';
import * as React from 'react';
import { Button } from 'rendition';

import * as FeaturedProject from '../../components/featured-project/featured-project';
import * as ImageSelector from '../../components/image-selector/image-selector';
import * as ReducedFlashingInfos from '../../components/reduced-flashing-infos/reduced-flashing-infos';
import { SettingsModal } from '../../components/settings/settings';
import * as SvgIcon from '../../components/svg-icon/svg-icon.jsx';
import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import * as settings from '../../models/settings';
import * as store from '../../models/store';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { ThemedProvider } from '../../styled-components';
import { colors } from '../../theme';
import * as middleEllipsis from '../../utils/middle-ellipsis';

import * as messages from '../../../../shared/messages';
import { bytesToClosestUnit } from '../../../../shared/units';

import { DriveSelector } from './DriveSelector';
import { Flash } from './Flash';

const DEFAULT_SUPPORT_URL =
	'https://github.com/balena-io/etcher/blob/master/SUPPORT.md';

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

const MainPage = ({ $state }: any) => {
	const setRefresh = React.useState(false)[1];
	const [isWebviewShowing, setIsWebviewShowing] = React.useState(false);
	const [hideSettings, setHideSettings] = React.useState(true);
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
		<ThemedProvider style={{ height: '100%' }}>
			<header
				id="app-header"
				style={{
					width: '100%',
					padding: '13px 14px',
					textAlign: 'center',
				}}
			>
				<span
					style={{
						cursor: 'pointer',
					}}
					onClick={() =>
						openExternal('https://www.balena.io/etcher?ref=etcher_footer')
					}
					tabIndex={100}
				>
					<SvgIcon
						paths={['../../assets/etcher.svg']}
						width="123px"
						height="22px"
					></SvgIcon>
				</span>

				<span
					style={{
						float: 'right',
						position: 'absolute',
						right: 0,
					}}
				>
					<Button
						icon={<FontAwesomeIcon icon={faCog} />}
						color={colors.secondary.background}
						fontSize={24}
						style={{ width: '30px' }}
						plain
						onClick={() => setHideSettings(false)}
						tabIndex={5}
					/>
					{!settings.get('disableExternalLinks') && (
						<Button
							icon={<FontAwesomeIcon icon={faQuestionCircle} />}
							color={colors.secondary.background}
							fontSize={24}
							style={{ width: '30px' }}
							plain
							onClick={() =>
								openExternal(
									selectionState.getImageSupportUrl() || DEFAULT_SUPPORT_URL,
								)
							}
							tabIndex={5}
						/>
					)}
				</span>
			</header>
			{hideSettings ? null : (
				<SettingsModal
					toggleModal={(value: boolean) => {
						setHideSettings(!value);
					}}
				/>
			)}

			<div className="page-main row around-xs" style={{ margin: '110px 50px' }}>
				<div className="col-xs">
					<ImageSelector flashing={isFlashing} />
				</div>

				<div className="col-xs">
					<DriveSelector
						webviewShowing={isWebviewShowing}
						disabled={shouldDriveStepBeDisabled}
						nextStepDisabled={shouldFlashStepBeDisabled}
						hasDrive={hasDrive}
						flashing={isFlashing}
					/>
				</div>

				{isFlashing && (
					<div
						className={`featured-project ${
							isFlashing && isWebviewShowing ? 'fp-visible' : ''
						}`}
					>
						<FeaturedProject onWebviewShow={setWebviewShowing} />
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
						goToSuccess={() => $state.go('success')}
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
