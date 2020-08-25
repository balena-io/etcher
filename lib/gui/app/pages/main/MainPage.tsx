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

import CogSvg from '@fortawesome/fontawesome-free/svgs/solid/cog.svg';
import QuestionCircleSvg from '@fortawesome/fontawesome-free/svgs/solid/question-circle.svg';

import { sourceDestination } from 'etcher-sdk';
import * as _ from 'lodash';
import * as path from 'path';
import * as React from 'react';
import { Flex } from 'rendition';
import styled from 'styled-components';

import FinishPage from '../../components/finish/finish';
import { ReducedFlashingInfos } from '../../components/reduced-flashing-infos/reduced-flashing-infos';
import { SafeWebview } from '../../components/safe-webview/safe-webview';
import { SettingsModal } from '../../components/settings/settings';
import {
	SourceOptions,
	SourceSelector,
} from '../../components/source-selector/source-selector';
import * as flashState from '../../models/flash-state';
import * as selectionState from '../../models/selection-state';
import * as settings from '../../models/settings';
import { observe } from '../../models/store';
import { open as openExternal } from '../../os/open-external/services/open-external';
import {
	IconButton as BaseIcon,
	ThemedProvider,
} from '../../styled-components';

import { bytesToClosestUnit } from '../../../../shared/units';

import { DriveSelector, getDriveListLabel } from './DriveSelector';
import { FlashStep } from './Flash';

import EtcherSvg from '../../../assets/etcher.svg';

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

const StepBorder = styled.div<{
	disabled: boolean;
	left?: boolean;
	right?: boolean;
}>`
	position: relative;
	height: 2px;
	background-color: ${(props) =>
		props.disabled
			? props.theme.colors.dark.disabled.foreground
			: props.theme.colors.dark.foreground};
	width: 120px;
	top: 19px;

	left: ${(props) => (props.left ? '-67px' : undefined)};
	margin-right: ${(props) => (props.left ? '-120px' : undefined)};
	right: ${(props) => (props.right ? '-67px' : undefined)};
	margin-left: ${(props) => (props.right ? '-120px' : undefined)};
`;

interface MainPageStateFromStore {
	isFlashing: boolean;
	hasImage: boolean;
	hasDrive: boolean;
	imageLogo: string;
	imageSize: number;
	imageName: string;
	driveTitle: string;
	driveLabel: string;
}

interface MainPageState {
	current: 'main' | 'success';
	isWebviewShowing: boolean;
	hideSettings: boolean;
	source: SourceOptions;
	featuredProjectURL?: string;
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
			driveLabel: getDriveListLabel(),
		};
	}

	private async getFeaturedProjectURL() {
		const url = new URL(
			(await settings.get('featuredProjectEndpoint')) ||
				'https://assets.balena.io/etcher-featured/index.html',
		);
		url.searchParams.append('borderRight', 'false');
		url.searchParams.append('darkBackground', 'true');
		return url.toString();
	}

	public async componentDidMount() {
		observe(() => {
			this.setState(this.stateHelper());
		});
		this.setState({ featuredProjectURL: await this.getFeaturedProjectURL() });
	}

	private renderMain() {
		const state = flashState.getFlashState();
		const shouldDriveStepBeDisabled = !this.state.hasImage;
		const shouldFlashStepBeDisabled =
			!this.state.hasImage || !this.state.hasDrive;
		const notFlashingOrSplitView =
			!this.state.isFlashing || !this.state.isWebviewShowing;
		return (
			<>
				<Flex
					justifyContent="space-between"
					alignItems="center"
					paddingTop="14px"
					style={{
						// Allow window to be dragged from header
						// @ts-ignore
						'-webkit-app-region': 'drag',
						position: 'relative',
						zIndex: 1,
					}}
				>
					<Flex width="100%" />
					<Flex width="100%" alignItems="center" justifyContent="center">
						<EtcherSvg
							width="123px"
							height="22px"
							style={{
								cursor: 'pointer',
							}}
							onClick={() =>
								openExternal('https://www.balena.io/etcher?ref=etcher_footer')
							}
							tabIndex={100}
						/>
					</Flex>

					<Flex width="100%" alignItems="center" justifyContent="flex-end">
						<Icon
							icon={<CogSvg height="1em" fill="currentColor" />}
							plain
							tabIndex={5}
							onClick={() => this.setState({ hideSettings: false })}
							style={{
								// Make touch events click instead of dragging
								'-webkit-app-region': 'no-drag',
							}}
						/>
						{!settings.getSync('disableExternalLinks') && (
							<Icon
								icon={<QuestionCircleSvg height="1em" fill="currentColor" />}
								onClick={() =>
									openExternal(
										selectionState.getImageSupportUrl() ||
											'https://github.com/balena-io/etcher/blob/master/SUPPORT.md',
									)
								}
								tabIndex={6}
								style={{
									// Make touch events click instead of dragging
									'-webkit-app-region': 'no-drag',
								}}
							/>
						)}
					</Flex>
				</Flex>
				{this.state.hideSettings ? null : (
					<SettingsModal
						toggleModal={(value: boolean) => {
							this.setState({ hideSettings: !value });
						}}
					/>
				)}

				<Flex
					m={`110px ${this.state.isWebviewShowing ? 35 : 55}px`}
					justifyContent="space-between"
				>
					{notFlashingOrSplitView && (
						<SourceSelector
							flashing={this.state.isFlashing}
							afterSelected={(source: SourceOptions) =>
								this.setState({ source })
							}
						/>
					)}

					{notFlashingOrSplitView && (
						<Flex>
							<StepBorder disabled={shouldDriveStepBeDisabled} left />
						</Flex>
					)}

					{notFlashingOrSplitView && (
						<DriveSelector
							disabled={shouldDriveStepBeDisabled}
							hasDrive={this.state.hasDrive}
							flashing={this.state.isFlashing}
						/>
					)}

					{notFlashingOrSplitView && (
						<Flex>
							<StepBorder disabled={shouldFlashStepBeDisabled} right />
						</Flex>
					)}

					{this.state.isFlashing && (
						<>
							<Flex
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '36.2vw',
									height: '100vh',
									zIndex: 1,
									boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.2)',
									display: this.state.isWebviewShowing ? 'block' : 'none',
								}}
							>
								<ReducedFlashingInfos
									imageLogo={this.state.imageLogo}
									imageName={this.state.imageName}
									imageSize={
										_.isNumber(this.state.imageSize)
											? (bytesToClosestUnit(this.state.imageSize) as string)
											: ''
									}
									driveTitle={this.state.driveTitle}
									driveLabel={this.state.driveLabel}
									style={{
										position: 'absolute',
										color: '#fff',
										left: 35,
										top: 72,
									}}
								/>
							</Flex>
							{this.state.featuredProjectURL && (
								<SafeWebview
									src={this.state.featuredProjectURL}
									onWebviewShow={(isWebviewShowing: boolean) => {
										this.setState({ isWebviewShowing });
									}}
									style={{
										position: 'absolute',
										right: 0,
										bottom: 0,
										width: '63.8vw',
										height: '100vh',
									}}
								/>
							)}
						</>
					)}

					<FlashStep
						goToSuccess={() => this.setState({ current: 'success' })}
						shouldFlashStepBeDisabled={shouldFlashStepBeDisabled}
						source={this.state.source}
						isFlashing={this.state.isFlashing}
						step={state.type}
						percentage={state.percentage}
						position={state.position}
						failed={state.failed}
						speed={state.speed}
						eta={state.eta}
						style={{ zIndex: 1 }}
					/>
				</Flex>
			</>
		);
	}

	private renderSuccess() {
		return (
			<Flex flexDirection="column" alignItems="center" height="100%">
				<FinishPage
					goToMain={() => {
						flashState.resetState();
						this.setState({ current: 'main' });
					}}
				/>
				<SafeWebview
					src="https://www.balena.io/etcher/success-banner/"
					style={{
						width: '100%',
						height: '320px',
						position: 'absolute',
						bottom: 0,
					}}
				/>
			</Flex>
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
