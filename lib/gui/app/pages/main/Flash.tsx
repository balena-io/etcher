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
import * as path from 'path';
import * as React from 'react';
import { Modal, Txt } from 'rendition';
import * as constraints from '../../../../shared/drive-constraints';
import * as messages from '../../../../shared/messages';
import * as ProgressButton from '../../components/progress-button/progress-button.jsx';
import * as SvgIcon from '../../components/svg-icon/svg-icon.jsx';
import * as availableDrives from '../../models/available-drives';
import * as flashState from '../../models/flash-state';
import * as selection from '../../models/selection-state';
import * as store from '../../models/store';
import * as analytics from '../../modules/analytics';
import * as driveScanner from '../../modules/drive-scanner';
import * as imageWriter from '../../modules/image-writer';
import * as progressStatus from '../../modules/progress-status';
import * as notification from '../../os/notification';

const COMPLETED_PERCENTAGE = 100;
const SPEED_PRECISION = 2;

const getWarningMessages = (drives: any, image: any) => {
	const warningMessages = [];
	for (const drive of drives) {
		if (constraints.isDriveSizeLarge(drive)) {
			warningMessages.push(messages.warning.largeDriveSize(drive));
		} else if (!constraints.isDriveSizeRecommended(drive, image)) {
			warningMessages.push(
				messages.warning.unrecommendedDriveSize(image, drive),
			);
		}

		// TODO(Shou): we should consider adding the same warning dialog for system drives and remove unsafe mode
	}

	return warningMessages;
};

const getErrorMessageFromCode = (errorCode: string) => {
	// TODO: All these error codes to messages translations
	// should go away if the writer emitted user friendly
	// messages on the first place.
	if (errorCode === 'EVALIDATION') {
		return messages.error.validation();
	} else if (errorCode === 'EUNPLUGGED') {
		return messages.error.driveUnplugged();
	} else if (errorCode === 'EIO') {
		return messages.error.inputOutput();
	} else if (errorCode === 'ENOSPC') {
		return messages.error.notEnoughSpaceInDrive();
	} else if (errorCode === 'ECHILDDIED') {
		return messages.error.childWriterDied();
	}
	return '';
};

const flashImageToDrive = async (goToSuccess: () => void) => {
	const devices = selection.getSelectedDevices();
	const image: any = selection.getImage();
	const drives = _.filter(availableDrives.getDrives(), (drive: any) => {
		return _.includes(devices, drive.device);
	});

	// eslint-disable-next-line no-magic-numbers
	if (drives.length === 0 || flashState.isFlashing()) {
		return '';
	}

	// Stop scanning drives when flashing
	// otherwise Windows throws EPERM
	driveScanner.stop();

	const iconPath = '../../assets/icon.png';
	const basename = path.basename(image.path);
	try {
		await imageWriter.flash(image.path, drives);
		if (!flashState.wasLastFlashCancelled()) {
			const flashResults: any = flashState.getFlashResults();
			notification.send('Flash complete!', {
				body: messages.info.flashComplete(
					basename,
					drives as any,
					flashResults.results.devices,
				),
				icon: iconPath,
			});
			goToSuccess();
		}
	} catch (error) {
		// When flashing is cancelled before starting above there is no error
		if (!error) {
			return '';
		}

		notification.send('Oops! Looks like the flash failed.', {
			body: messages.error.flashFailure(path.basename(image.path), drives),
			icon: iconPath,
		});

		let errorMessage = getErrorMessageFromCode(error.code);
		if (!errorMessage) {
			error.image = basename;
			analytics.logException(error);
			errorMessage = messages.error.genericFlashError();
		}

		return errorMessage;
	} finally {
		availableDrives.setDrives([]);
		driveScanner.start();
	}

	return '';
};

/**
 * @summary Get progress button label
 * @function
 * @public
 *
 * @returns {String} progress button label
 *
 * @example
 * const label = FlashController.getProgressButtonLabel()
 */
const getProgressButtonLabel = () => {
	if (!flashState.isFlashing()) {
		return 'Flash!';
	}

	return progressStatus.fromFlashState(flashState.getFlashState());
};

const formatSeconds = (totalSeconds: number) => {
	if (!totalSeconds && !_.isNumber(totalSeconds)) {
		return '';
	}
	// eslint-disable-next-line no-magic-numbers
	const minutes = Math.floor(totalSeconds / 60);
	// eslint-disable-next-line no-magic-numbers
	const seconds = Math.floor(totalSeconds - minutes * 60);

	return `${minutes}m${seconds}s`;
};

export const Flash = ({
	shouldFlashStepBeDisabled,
	lastFlashErrorCode,
	progressMessage,
	goToSuccess,
	DriveSelectorService,
}: any) => {
	const state: any = flashState.getFlashState();
	const isFlashing = flashState.isFlashing();
	const flashErrorCode = lastFlashErrorCode();

	const [warningMessages, setWarningMessages] = React.useState<string[]>([]);
	const [errorMessage, setErrorMessage] = React.useState('');

	const handleWarningResponse = async (shouldContinue: boolean) => {
		setWarningMessages([]);

		if (!shouldContinue) {
			DriveSelectorService.open();
			return;
		}

		setErrorMessage(await flashImageToDrive(goToSuccess));
	};

	const handleFlashErrorResponse = (shouldRetry: boolean) => {
		setErrorMessage('');
		flashState.resetState();
		if (shouldRetry) {
			analytics.logEvent('Restart after failure', {
				applicationSessionUuid: (store as any).getState().toJS()
					.applicationSessionUuid,
				flashingWorkflowUuid: (store as any).getState().toJS()
					.flashingWorkflowUuid,
			});
		} else {
			selection.clear();
		}
	};

	const tryFlash = async () => {
		const devices = selection.getSelectedDevices();
		const image = selection.getImage();
		const drives = _.filter(availableDrives.getDrives(), (drive: any) => {
			return _.includes(devices, drive.device);
		});

		// eslint-disable-next-line no-magic-numbers
		if (drives.length === 0 || flashState.isFlashing()) {
			return;
		}

		const hasDangerStatus = constraints.hasListDriveImageCompatibilityStatus(
			drives,
			image,
		);
		if (hasDangerStatus) {
			setWarningMessages(getWarningMessages(drives, image));
			return;
		}

		setErrorMessage(await flashImageToDrive(goToSuccess));
	};

	return (
		<React.Fragment>
			<div className="box text-center">
				<div className="center-block">
					<SvgIcon
						paths={['../../assets/flash.svg']}
						disabled={shouldFlashStepBeDisabled}
					/>
				</div>

				<div className="space-vertical-large">
					<ProgressButton
						tabindex="3"
						striped={state.type === 'verifying'}
						active={isFlashing}
						percentage={state.percentage}
						label={getProgressButtonLabel()}
						disabled={Boolean(flashErrorCode) || shouldFlashStepBeDisabled}
						callback={tryFlash}
					></ProgressButton>

					{isFlashing && (
						<button
							className="button button-link button-abort-write"
							onClick={imageWriter.cancel}
						>
							<span className="glyphicon glyphicon-remove-sign"></span>
						</button>
					)}
					{!_.isNil(state.speed) && state.percentage !== COMPLETED_PERCENTAGE && (
						<p className="step-footer step-footer-split">
							{Boolean(state.speed) && (
								<span>{`${state.speed.toFixed(SPEED_PRECISION)} MB/s`}</span>
							)}
							{!_.isNil(state.eta) && (
								<span>{`ETA: ${formatSeconds(state.eta)}`}</span>
							)}
						</p>
					)}

					{Boolean(state.failed) && (
						<div className="target-status-wrap">
							<div className="target-status-line target-status-failed">
								<span className="target-status-dot"></span>
								<span className="target-status-quantity">{state.failed}</span>
								<span className="target-status-message">
									{progressMessage.failed(state.failed)}{' '}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* eslint-disable-next-line no-magic-numbers */}
			{warningMessages && warningMessages.length > 0 && (
				<Modal
					width={400}
					titleElement={'Attention'}
					cancel={() => handleWarningResponse(false)}
					done={() => handleWarningResponse(true)}
					cancelButtonProps={{
						children: 'Change',
					}}
					action={'Continue'}
					primaryButtonProps={{ primary: false, warning: true }}
				>
					{_.map(warningMessages, message => (
						<Txt whitespace="pre-line" mt={2}>
							{message}
						</Txt>
					))}
				</Modal>
			)}

			{errorMessage && (
				<Modal
					width={400}
					titleElement={'Attention'}
					cancel={() => handleFlashErrorResponse(false)}
					done={() => handleFlashErrorResponse(true)}
					action={'Retry'}
				>
					<Txt>{errorMessage}</Txt>
				</Modal>
			)}
		</React.Fragment>
	);
};
