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
import FinishPage from '../../components/finish/finish';
import * as ImageSelector from '../../components/image-selector/image-selector';
import * as ReducedFlashingInfos from '../../components/reduced-flashing-infos/reduced-flashing-infos';
import * as SafeWebview from '../../components/safe-webview/safe-webview';
import { SettingsModal } from '../../components/settings/settings';
import * as SvgIcon from '../../components/svg-icon/svg-icon.jsx';
import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import * as settings from '../../models/settings';
import * as store from '../../models/store';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { ThemedProvider } from '../../styled-components';
import { colors } from '../../theme';
import { middleEllipsis } from '../../utils/middle-ellipsis';

import { bytesToClosestUnit } from '../../../../shared/units';

import { DriveSelector } from './DriveSelector';
import { Flash } from './Flash';

function getDrivesTitle() {
	const drives = selectionState.getSelectedDrives();

	if (drives.length === 1) {
		// @ts-ignore
		return drives[0].description || 'Untitled Device';
	}

	if (drives.length === 0) {
		return 'No targets found';
	}

	return `${drives.length} Targets`;
}

function getImageBasename() {
	if (!selectionState.hasImage()) {
		return '';
	}

	const selectionImageName = selectionState.getImageName();
	const imageBasename = path.basename(selectionState.getImagePath());
	return selectionImageName || imageBasename;
}

interface MainPageStateFromStore {
	isFlashing: boolean;
	hasImage: boolean;
	hasDrive: boolean;
	imageLogo: string;
	imageSize: number;
	imageName: string;
	driveTitle: string;
}

interface MainPageState {
	current: 'main' | 'success';
	isWebviewShowing: boolean;
	hideSettings: boolean;
}

export class MainPage extends React.Component<
	{},
	MainPageState & MainPageStateFromStore
> {
	constructor(props: {}) {
		super(props);
		this.state = {
			current: 'main',
			isWebviewShowing: false,
			hideSettings: true,
			...this.stateHelper(),
		};
	}

	private stateHelper(): MainPageStateFromStore {
		return {
			isFlashing: flashState.isFlashing(),
			hasImage: selectionState.hasImage(),
			hasDrive: selectionState.hasDrive(),
			imageLogo: selectionState.getImageLogo(),
			imageSize: selectionState.getImageSize(),
			imageName: getImageBasename(),
			driveTitle: getDrivesTitle(),
		};
	}

	public componentDidMount() {
		(store as any).observe(() => {
			this.setState(this.stateHelper());
		});
	}

	public render() {
		const shouldDriveStepBeDisabled = !this.state.hasImage;
		const shouldFlashStepBeDisabled =
			!this.state.hasImage || !this.state.hasDrive;

		if (this.state.current === 'main') {
			return (
				<ThemedProvider style={{ height: '100%', width: '100%' }}>
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
								onClick={() => this.setState({ hideSettings: false })}
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
											selectionState.getImageSupportUrl() ||
												'https://github.com/balena-io/etcher/blob/master/SUPPORT.md',
										)
									}
									tabIndex={5}
								/>
							)}
						</span>
					</header>
					{this.state.hideSettings ? null : (
						<SettingsModal
							toggleModal={(value: boolean) => {
								this.setState({ hideSettings: !value });
							}}
						/>
					)}

					<div
						className="page-main row around-xs"
						style={{ margin: '110px 50px' }}
					>
						<div className="col-xs">
							<ImageSelector flashing={this.state.isFlashing} />
						</div>

						<div className="col-xs">
							<DriveSelector
								webviewShowing={this.state.isWebviewShowing}
								disabled={shouldDriveStepBeDisabled}
								nextStepDisabled={shouldFlashStepBeDisabled}
								hasDrive={this.state.hasDrive}
								flashing={this.state.isFlashing}
							/>
						</div>

						{this.state.isFlashing && (
							<div
								className={`featured-project ${
									this.state.isFlashing && this.state.isWebviewShowing
										? 'fp-visible'
										: ''
								}`}
							>
								<FeaturedProject
									onWebviewShow={(isWebviewShowing: boolean) => {
										this.setState({ isWebviewShowing });
									}}
								/>
							</div>
						)}

						<div>
							<ReducedFlashingInfos
								imageLogo={this.state.imageLogo}
								imageName={middleEllipsis(this.state.imageName, 16)}
								imageSize={bytesToClosestUnit(this.state.imageSize)}
								driveTitle={middleEllipsis(this.state.driveTitle, 16)}
								shouldShow={
									this.state.isFlashing && this.state.isWebviewShowing
								}
							/>
						</div>

						<div className="col-xs">
							<Flash
								goToSuccess={() => this.setState({ current: 'success' })}
								shouldFlashStepBeDisabled={shouldFlashStepBeDisabled}
							/>
						</div>
					</div>
				</ThemedProvider>
			);
		} else if (this.state.current === 'success') {
			return (
				<div className="section-loader isFinish">
					<FinishPage goToMain={() => this.setState({ current: 'main' })} />
					<SafeWebview src="https://www.balena.io/etcher/success-banner/" />
				</div>
			);
		}
	}
}

export default MainPage;
