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
import { sourceDestination } from 'etcher-sdk';
import * as _ from 'lodash';
import * as path from 'path';
import * as React from 'react';
import { Flex } from 'rendition';
import styled from 'styled-components';

import { SafeWebview } from '../../components/safe-webview/safe-webview';
import { FeaturedProject } from '../../components/featured-project/featured-project';
import FinishPage from '../../components/finish/finish';
import { ReducedFlashingInfos } from '../../components/reduced-flashing-infos/reduced-flashing-infos';
import { SettingsModal } from '../../components/settings/settings';
import {
	SourceOptions,
	SourceSelector,
} from '../../components/source-selector/source-selector';
import { SVGIcon } from '../../components/svg-icon/svg-icon';
import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import * as settings from '../../models/settings';
import { observe } from '../../models/store';
import { open as openExternal } from '../../os/open-external/services/open-external';
import {
	IconButton as BaseIcon,
	ThemedProvider,
} from '../../styled-components';
import { middleEllipsis } from '../../utils/middle-ellipsis';

import { bytesToClosestUnit } from '../../../../shared/units';

import { DriveSelector } from './DriveSelector';
import { FlashStep } from './Flash';

const Icon = styled(BaseIcon)`
	margin-right: 20px;
`;

function getDrivesTitle() {
	const drives = selectionState.getSelectedDrives();

	if (drives.length === 1) {
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
	source: SourceOptions;
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
			source: {
				imagePath: '',
				SourceType: sourceDestination.File,
			},
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
		observe(() => {
			this.setState(this.stateHelper());
		});
	}

	private renderMain() {
		const state = flashState.getFlashState();
		const shouldDriveStepBeDisabled = !this.state.hasImage;
		const shouldFlashStepBeDisabled =
			!this.state.hasImage || !this.state.hasDrive;
		return (
			<>
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
						<SVGIcon paths={['etcher.svg']} width="123px" height="22px" />
					</span>

					<span
						style={{
							float: 'right',
							position: 'absolute',
							right: 0,
						}}
					>
						<Icon
							icon={<FontAwesomeIcon icon={faCog} />}
							plain
							tabIndex={5}
							onClick={() => this.setState({ hideSettings: false })}
						/>
						{!settings.getSync('disableExternalLinks') && (
							<Icon
								icon={<FontAwesomeIcon icon={faQuestionCircle} />}
								onClick={() =>
									openExternal(
										selectionState.getImageSupportUrl() ||
											'https://github.com/balena-io/etcher/blob/master/SUPPORT.md',
									)
								}
								tabIndex={6}
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

				<Flex
					className="page-main row around-xs"
					style={{ margin: '110px 50px' }}
				>
					<div className="col-xs">
						<SourceSelector
							flashing={this.state.isFlashing}
							afterSelected={(source: SourceOptions) =>
								this.setState({ source })
							}
						/>
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
							imageSize={
								_.isNumber(this.state.imageSize)
									? (bytesToClosestUnit(this.state.imageSize) as string)
									: ''
							}
							driveTitle={middleEllipsis(this.state.driveTitle, 16)}
							shouldShow={this.state.isFlashing && this.state.isWebviewShowing}
						/>
					</div>

					<div className="col-xs">
						<FlashStep
							goToSuccess={() => this.setState({ current: 'success' })}
							shouldFlashStepBeDisabled={shouldFlashStepBeDisabled}
							source={this.state.source}
							isFlashing={flashState.isFlashing()}
							step={state.type}
							percentage={state.percentage}
							position={state.position}
							failed={state.failed}
							speed={state.speed}
							eta={state.eta}
						/>
					</div>
				</Flex>
			</>
		);
	}

	private renderSuccess() {
		return (
			<div className="section-loader isFinish">
				<FinishPage
					goToMain={() => {
						flashState.resetState();
						this.setState({ current: 'main' });
					}}
				/>
				<SafeWebview src="https://www.balena.io/etcher/success-banner/" />
			</div>
		);
	}

	public render() {
		return (
			<ThemedProvider style={{ height: '100%', width: '100%' }}>
				{this.state.current === 'main'
					? this.renderMain()
					: this.renderSuccess()}
			</ThemedProvider>
		);
	}
}

export default MainPage;
