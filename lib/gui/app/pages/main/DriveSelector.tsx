/*
 * Copyright 2016 resin.io
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
import * as propTypes from 'prop-types';
import * as React from 'react';
import styled from 'styled-components';
import * as driveConstraints from '../../../../shared/drive-constraints';
import * as utils from '../../../../shared/utils';
import * as TargetSelector from '../../components/drive-selector/target-selector.jsx';
import * as SvgIcon from '../../components/svg-icon/svg-icon.jsx';
import * as selectionState from '../../models/selection-state';
import * as settings from '../../models/settings';
import * as store from '../../models/store';
import * as analytics from '../../modules/analytics';
import * as exceptionReporter from '../../modules/exception-reporter';

const StepBorder = styled.div<{
	disabled: boolean;
	left?: boolean;
	right?: boolean;
}>`
	height: 2px;
	background-color: ${props =>
		props.disabled
			? props.theme.customColors.dark.disabled.foreground
			: props.theme.customColors.dark.foreground};
	position: absolute;
	width: 124px;
	top: 19px;

	left: ${props => (props.left ? '-67px' : undefined)};
	right: ${props => (props.right ? '-67px' : undefined)};
`;

const getDriveListLabel = () => {
	return _.join(
		_.map(selectionState.getSelectedDrives(), (drive: any) => {
			return `${drive.description} (${drive.displayName})`;
		}),
		'\n',
	);
};

const openDriveSelector = async (DriveSelectorService: any) => {
	try {
		const drive = await DriveSelectorService.open();
		if (!drive) {
			return;
		}

		selectionState.selectDrive(drive.device);

		analytics.logEvent('Select drive', {
			device: drive.device,
			unsafeMode:
				settings.get('unsafeMode') && !settings.get('disableUnsafeMode'),
			applicationSessionUuid: (store as any).getState().toJS()
				.applicationSessionUuid,
			flashingWorkflowUuid: (store as any).getState().toJS()
				.flashingWorkflowUuid,
		});
	} catch (error) {
		exceptionReporter.report(error);
	}
};

const reselectDrive = (DriveSelectorService: any) => {
	openDriveSelector(DriveSelectorService);
	analytics.logEvent('Reselect drive', {
		applicationSessionUuid: (store as any).getState().toJS()
			.applicationSessionUuid,
		flashingWorkflowUuid: (store as any).getState().toJS().flashingWorkflowUuid,
	});
};

const getMemoizedSelectedDrives = utils.memoize(
	selectionState.getSelectedDrives,
	_.isEqual,
);

const shouldShowDrivesButton = () => {
	return !settings.get('disableExplicitDriveSelection');
};

const getDriveSelectionStateSlice = () => ({
	showDrivesButton: shouldShowDrivesButton(),
	driveListLabel: getDriveListLabel(),
	targets: getMemoizedSelectedDrives(),
});

export const DriveSelector = ({
	webviewShowing,
	disabled,
	nextStepDisabled,
	hasDrive,
	flashing,
	DriveSelectorService,
}: any) => {
	// TODO: inject these from redux-connector
	const [
		{ showDrivesButton, driveListLabel, targets },
		setStateSlice,
	] = React.useState(getDriveSelectionStateSlice());

	React.useEffect(() => {
		return (store as any).observe(() => {
			setStateSlice(getDriveSelectionStateSlice());
		});
	}, []);

	const showStepConnectingLines = !webviewShowing || !flashing;

	return (
		<div className="box text-center relative">
			{showStepConnectingLines && (
				<React.Fragment>
					<StepBorder disabled={disabled} left />
					<StepBorder disabled={nextStepDisabled} right />
				</React.Fragment>
			)}

			<div className="center-block">
				<SvgIcon paths={['../../assets/drive.svg']} disabled={disabled} />
			</div>

			<div className="space-vertical-large">
				<TargetSelector
					disabled={disabled}
					show={!hasDrive && showDrivesButton}
					tooltip={driveListLabel}
					selection={selectionState}
					openDriveSelector={() => openDriveSelector(DriveSelectorService)}
					reselectDrive={() => reselectDrive(DriveSelectorService)}
					flashing={flashing}
					constraints={driveConstraints}
					targets={targets}
				/>
			</div>
		</div>
	);
};

DriveSelector.propTypes = {
	webviewShowing: propTypes.bool,
	disabled: propTypes.bool,
	nextStepDisabled: propTypes.bool,
	hasDrive: propTypes.bool,
	flashing: propTypes.bool,
	DriveSelectorService: propTypes.object,
};
