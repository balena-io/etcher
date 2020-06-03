/*
 * Copyright 2016 balena.io
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
import styled from 'styled-components';
import { DriveSelectorModal } from '../../components/drive-selector/DriveSelectorModal';
import { TargetSelector } from '../../components/drive-selector/target-selector';
import { SVGIcon } from '../../components/svg-icon/svg-icon';
import { getImage, getSelectedDrives } from '../../models/selection-state';
import * as settings from '../../models/settings';
import { observe } from '../../models/store';
import * as analytics from '../../modules/analytics';

const StepBorder = styled.div<{
	disabled: boolean;
	left?: boolean;
	right?: boolean;
}>`
	height: 2px;
	background-color: ${(props) =>
		props.disabled
			? props.theme.colors.dark.disabled.foreground
			: props.theme.colors.dark.foreground};
	position: absolute;
	width: 124px;
	top: 19px;

	left: ${(props) => (props.left ? '-67px' : undefined)};
	right: ${(props) => (props.right ? '-67px' : undefined)};
`;

const getDriveListLabel = () => {
	return _.join(
		_.map(getSelectedDrives(), (drive: any) => {
			return `${drive.description} (${drive.displayName})`;
		}),
		'\n',
	);
};

const shouldShowDrivesButton = () => {
	return !settings.getSync('disableExplicitDriveSelection');
};

const getDriveSelectionStateSlice = () => ({
	showDrivesButton: shouldShowDrivesButton(),
	driveListLabel: getDriveListLabel(),
	targets: getSelectedDrives(),
	image: getImage(),
});

interface DriveSelectorProps {
	webviewShowing: boolean;
	disabled: boolean;
	nextStepDisabled: boolean;
	hasDrive: boolean;
	flashing: boolean;
}

export const DriveSelector = ({
	webviewShowing,
	disabled,
	nextStepDisabled,
	hasDrive,
	flashing,
}: DriveSelectorProps) => {
	// TODO: inject these from redux-connector
	const [
		{ showDrivesButton, driveListLabel, targets, image },
		setStateSlice,
	] = React.useState(getDriveSelectionStateSlice());
	const [showDriveSelectorModal, setShowDriveSelectorModal] = React.useState(
		false,
	);

	React.useEffect(() => {
		return observe(() => {
			setStateSlice(getDriveSelectionStateSlice());
		});
	}, []);

	const showStepConnectingLines = !webviewShowing || !flashing;

	return (
		<div className="box text-center relative">
			{showStepConnectingLines && (
				<>
					<StepBorder disabled={disabled} left />
					<StepBorder disabled={nextStepDisabled} right />
				</>
			)}

			<div className="center-block">
				<SVGIcon paths={['drive.svg']} disabled={disabled} />
			</div>

			<div className="space-vertical-large">
				<TargetSelector
					disabled={disabled}
					show={!hasDrive && showDrivesButton}
					tooltip={driveListLabel}
					openDriveSelector={() => {
						setShowDriveSelectorModal(true);
					}}
					reselectDrive={() => {
						analytics.logEvent('Reselect drive');
						setShowDriveSelectorModal(true);
					}}
					flashing={flashing}
					targets={targets}
					image={image}
				/>
			</div>

			{showDriveSelectorModal && (
				<DriveSelectorModal
					close={() => setShowDriveSelectorModal(false)}
				></DriveSelectorModal>
			)}
		</div>
	);
};
