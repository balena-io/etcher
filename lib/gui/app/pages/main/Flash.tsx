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
import * as path from 'path';
import * as React from 'react';
import { Flex, Modal, Txt } from 'rendition';

import * as constraints from '../../../../shared/drive-constraints';
import * as messages from '../../../../shared/messages';
import { DriveSelectorModal } from '../../components/drive-selector/DriveSelectorModal';
import { ProgressButton } from '../../components/progress-button/progress-button';
import { SourceOptions } from '../../components/source-selector/source-selector';
import { SVGIcon } from '../../components/svg-icon/svg-icon';
import * as availableDrives from '../../models/available-drives';
import * as flashState from '../../models/flash-state';
import * as selection from '../../models/selection-state';
import * as analytics from '../../modules/analytics';
import { scanner as driveScanner } from '../../modules/drive-scanner';
import * as imageWriter from '../../modules/image-writer';
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

async function flashImageToDrive(
	isFlashing: boolean,
	goToSuccess: () => void,
	sourceOptions: SourceOptions,
): Promise<string> {
	const devices = selection.getSelectedDevices();
	const image: any = selection.getImage();
	const drives = _.filter(availableDrives.getDrives(), (drive: any) => {
		return _.includes(devices, drive.device);
	});

	if (drives.length === 0 || isFlashing) {
		return '';
	}

	// Stop scanning drives when flashing
	// otherwise Windows throws EPERM
	driveScanner.stop();

	const iconPath = path.join('media', 'icon.png');
	const basename = path.basename(image.path);
	try {
		await imageWriter.flash(image.path, drives, sourceOptions);
		if (!flashState.wasLastFlashCancelled()) {
			const flashResults: any = flashState.getFlashResults();
			notification.send(
				'Flash complete!',
				messages.info.flashComplete(
					basename,
					drives as any,
					flashResults.results.devices,
				),
				iconPath,
			);
			goToSuccess();
		}
	} catch (error) {
		notification.send(
			'Oops! Looks like the flash failed.',
			messages.error.flashFailure(path.basename(image.path), drives),
			iconPath,
		);
		let errorMessage = getErrorMessageFromCode(error.code);
		if (!errorMessage) {
			error.image = basename;
			analytics.logException(error);
			errorMessage = messages.error.genericFlashError(error);
		}
		return errorMessage;
	} finally {
		availableDrives.setDrives([]);
		driveScanner.start();
	}

	return '';
}

const formatSeconds = (totalSeconds: number) => {
	if (!totalSeconds && !_.isNumber(totalSeconds)) {
		return '';
	}
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds - minutes * 60);

	return `${minutes}m${seconds}s`;
};

interface FlashStepProps {
	shouldFlashStepBeDisabled: boolean;
	goToSuccess: () => void;
	source: SourceOptions;
	isFlashing: boolean;
	// TODO: factorize
	step: 'decompressing' | 'flashing' | 'verifying';
	percentage: number;
	position: number;
	failed: number;
	speed?: number;
	eta?: number;
}

interface FlashStepState {
	warningMessages: string[];
	errorMessage: string;
	showDriveSelectorModal: boolean;
}

export class FlashStep extends React.PureComponent<
	FlashStepProps,
	FlashStepState
> {
	constructor(props: FlashStepProps) {
		super(props);
		this.state = {
			warningMessages: [],
			errorMessage: '',
			showDriveSelectorModal: false,
		};
	}

	private async handleWarningResponse(shouldContinue: boolean) {
		this.setState({ warningMessages: [] });
		if (!shouldContinue) {
			this.setState({ showDriveSelectorModal: true });
			return;
		}
		this.setState({
			errorMessage: await flashImageToDrive(
				this.props.isFlashing,
				this.props.goToSuccess,
				this.props.source,
			),
		});
	}

	private handleFlashErrorResponse(shouldRetry: boolean) {
		this.setState({ errorMessage: '' });
		flashState.resetState();
		if (shouldRetry) {
			analytics.logEvent('Restart after failure');
		} else {
			selection.clear();
		}
	}

	private async tryFlash() {
		const devices = selection.getSelectedDevices();
		const image = selection.getImage();
		const drives = _.filter(
			availableDrives.getDrives(),
			(drive: { device: string }) => {
				return _.includes(devices, drive.device);
			},
		);
		if (drives.length === 0 || this.props.isFlashing) {
			return;
		}
		const hasDangerStatus = constraints.hasListDriveImageCompatibilityStatus(
			drives,
			image,
		);
		if (hasDangerStatus) {
			this.setState({ warningMessages: getWarningMessages(drives, image) });
			return;
		}
		this.setState({
			errorMessage: await flashImageToDrive(
				this.props.isFlashing,
				this.props.goToSuccess,
				this.props.source,
			),
		});
	}

	public render() {
		return (
			<>
				<div className="box text-center">
					<div className="center-block">
						<SVGIcon
							paths={['flash.svg']}
							disabled={this.props.shouldFlashStepBeDisabled}
						/>
					</div>

					<div className="space-vertical-large">
						<ProgressButton
							type={this.props.step}
							active={this.props.isFlashing}
							percentage={this.props.percentage}
							position={this.props.position}
							disabled={this.props.shouldFlashStepBeDisabled}
							cancel={imageWriter.cancel}
							callback={() => {
								this.tryFlash();
							}}
						/>

						{!_.isNil(this.props.speed) &&
							this.props.percentage !== COMPLETED_PERCENTAGE && (
								<Flex
									justifyContent="space-between"
									fontSize="14px"
									color="#7e8085"
								>
									{!_.isNil(this.props.speed) && (
										<Txt>{this.props.speed.toFixed(SPEED_PRECISION)} MB/s</Txt>
									)}
									{!_.isNil(this.props.eta) && (
										<Txt>ETA: {formatSeconds(this.props.eta)}</Txt>
									)}
								</Flex>
							)}

						{Boolean(this.props.failed) && (
							<div className="target-status-wrap">
								<div className="target-status-line target-status-failed">
									<span className="target-status-dot"></span>
									<span className="target-status-quantity">
										{this.props.failed}
									</span>
									<span className="target-status-message">
										{messages.progress.failed(this.props.failed)}{' '}
									</span>
								</div>
							</div>
						)}
					</div>
				</div>

				{this.state.warningMessages.length > 0 && (
					<Modal
						width={400}
						titleElement={'Attention'}
						cancel={() => this.handleWarningResponse(false)}
						done={() => this.handleWarningResponse(true)}
						cancelButtonProps={{
							children: 'Change',
						}}
						action={'Continue'}
						primaryButtonProps={{ primary: false, warning: true }}
					>
						{_.map(this.state.warningMessages, (message, key) => (
							<Txt key={key} whitespace="pre-line" mt={2}>
								{message}
							</Txt>
						))}
					</Modal>
				)}

				{this.state.errorMessage && (
					<Modal
						width={400}
						titleElement={'Attention'}
						cancel={() => this.handleFlashErrorResponse(false)}
						done={() => this.handleFlashErrorResponse(true)}
						action={'Retry'}
					>
						<Txt>
							{_.map(this.state.errorMessage.split('\n'), (message, key) => (
								<p key={key}>{message}</p>
							))}
						</Txt>
					</Modal>
				)}

				{this.state.showDriveSelectorModal && (
					<DriveSelectorModal
						close={() => this.setState({ showDriveSelectorModal: false })}
					/>
				)}
			</>
		);
	}
}
