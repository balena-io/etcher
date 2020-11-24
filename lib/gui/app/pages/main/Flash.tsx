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

import CircleSvg from '@fortawesome/fontawesome-free/svgs/solid/circle.svg';
import * as _ from 'lodash';
import * as path from 'path';
import * as React from 'react';
import { Flex, Modal as SmallModal, Txt } from 'rendition';

import * as constraints from '../../../../shared/drive-constraints';
import * as messages from '../../../../shared/messages';
import { ProgressButton } from '../../components/progress-button/progress-button';
import * as availableDrives from '../../models/available-drives';
import * as flashState from '../../models/flash-state';
import * as selection from '../../models/selection-state';
import * as analytics from '../../modules/analytics';
import { scanner as driveScanner } from '../../modules/drive-scanner';
import * as imageWriter from '../../modules/image-writer';
import * as notification from '../../os/notification';
import {
	selectAllTargets,
	TargetSelectorModal,
} from '../../components/target-selector/target-selector';

import FlashSvg from '../../../assets/flash.svg';
import DriveStatusWarningModal from '../../components/drive-status-warning-modal/drive-status-warning-modal';

const COMPLETED_PERCENTAGE = 100;
const SPEED_PRECISION = 2;

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
): Promise<string> {
	const devices = selection.getSelectedDevices();
	const image: any = selection.getImage();
	const drives = availableDrives.getDrives().filter((drive: any) => {
		return devices.includes(drive.device);
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
		await imageWriter.flash(image, drives);
		if (!flashState.wasLastFlashCancelled()) {
			const {
				results = { devices: { successful: 0, failed: 0 } },
			} = flashState.getFlashResults();
			notification.send(
				'Flash complete!',
				messages.info.flashComplete(basename, drives as any, results.devices),
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
	if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds)) {
		return '';
	}
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds - minutes * 60);

	return `${minutes}m${seconds}s`;
};

interface FlashStepProps {
	shouldFlashStepBeDisabled: boolean;
	goToSuccess: () => void;
	isFlashing: boolean;
	style?: React.CSSProperties;
	// TODO: factorize
	step: 'decompressing' | 'flashing' | 'verifying';
	percentage: number;
	position: number;
	failed: number;
	speed?: number;
	eta?: number;
}

export interface DriveWithWarnings extends constraints.DrivelistDrive {
	statuses: constraints.DriveStatus[];
}

interface FlashStepState {
	warningMessage: boolean;
	errorMessage: string;
	showDriveSelectorModal: boolean;
	systemDrives: boolean;
	drivesWithWarnings: DriveWithWarnings[];
}

export class FlashStep extends React.PureComponent<
	FlashStepProps,
	FlashStepState
> {
	constructor(props: FlashStepProps) {
		super(props);
		this.state = {
			warningMessage: false,
			errorMessage: '',
			showDriveSelectorModal: false,
			systemDrives: false,
			drivesWithWarnings: [],
		};
	}

	private async handleWarningResponse(shouldContinue: boolean) {
		this.setState({ warningMessage: false });
		if (!shouldContinue) {
			this.setState({ showDriveSelectorModal: true });
			return;
		}
		this.setState({
			errorMessage: await flashImageToDrive(
				this.props.isFlashing,
				this.props.goToSuccess,
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

	private hasListWarnings(drives: any[]) {
		if (drives.length === 0 || flashState.isFlashing()) {
			return;
		}
		return drives.filter((drive) => drive.isSystem).length > 0;
	}

	private async tryFlash() {
		const drives = selection.getSelectedDrives().map((drive) => {
			return {
				...drive,
				statuses: constraints.getDriveImageCompatibilityStatuses(
					drive,
					undefined,
					true,
				),
			};
		});
		if (drives.length === 0 || this.props.isFlashing) {
			return;
		}
		const hasDangerStatus = drives.some((drive) => drive.statuses.length > 0);
		if (hasDangerStatus) {
			const systemDrives = drives.some((drive) =>
				drive.statuses.includes(constraints.statuses.system),
			);
			this.setState({
				systemDrives,
				drivesWithWarnings: drives.filter((driveWithWarnings) => {
					return (
						driveWithWarnings.isSystem ||
						(!systemDrives &&
							driveWithWarnings.statuses.includes(constraints.statuses.large))
					);
				}),
				warningMessage: true,
			});
			return;
		}
		this.setState({
			errorMessage: await flashImageToDrive(
				this.props.isFlashing,
				this.props.goToSuccess,
			),
		});
	}

	public render() {
		return (
			<>
				<Flex
					flexDirection="column"
					alignItems="start"
					style={this.props.style}
				>
					<FlashSvg
						width="40px"
						className={this.props.shouldFlashStepBeDisabled ? 'disabled' : ''}
						style={{
							margin: '0 auto',
						}}
					/>

					<ProgressButton
						type={this.props.step}
						active={this.props.isFlashing}
						percentage={this.props.percentage}
						position={this.props.position}
						disabled={this.props.shouldFlashStepBeDisabled}
						cancel={imageWriter.cancel}
						warning={this.hasListWarnings(selection.getSelectedDrives())}
						callback={() => this.tryFlash()}
					/>

					{!_.isNil(this.props.speed) &&
						this.props.percentage !== COMPLETED_PERCENTAGE && (
							<Flex
								justifyContent="space-between"
								fontSize="14px"
								color="#7e8085"
								width="100%"
							>
								<Txt>{this.props.speed.toFixed(SPEED_PRECISION)} MB/s</Txt>
								{!_.isNil(this.props.eta) && (
									<Txt>ETA: {formatSeconds(this.props.eta)}</Txt>
								)}
							</Flex>
						)}

					{Boolean(this.props.failed) && (
						<Flex color="#fff" alignItems="center" mt={35}>
							<CircleSvg height="1em" fill="#ff4444" />
							<Txt ml={10}>{this.props.failed}</Txt>
							<Txt ml={10}>{messages.progress.failed(this.props.failed)}</Txt>
						</Flex>
					)}
				</Flex>

				{this.state.warningMessage && (
					<DriveStatusWarningModal
						done={() => this.handleWarningResponse(true)}
						cancel={() => this.handleWarningResponse(false)}
						isSystem={this.state.systemDrives}
						drivesWithWarnings={this.state.drivesWithWarnings}
					/>
				)}

				{this.state.errorMessage && (
					<SmallModal
						width={400}
						titleElement={'Attention'}
						cancel={() => this.handleFlashErrorResponse(false)}
						done={() => this.handleFlashErrorResponse(true)}
						action={'Retry'}
					>
						<Txt>
							{this.state.errorMessage.split('\n').map((message, key) => (
								<p key={key}>{message}</p>
							))}
						</Txt>
					</SmallModal>
				)}
				{this.state.showDriveSelectorModal && (
					<TargetSelectorModal
						write={true}
						cancel={() => this.setState({ showDriveSelectorModal: false })}
						done={(modalTargets) => {
							selectAllTargets(modalTargets);
							this.setState({ showDriveSelectorModal: false });
						}}
					/>
				)}
			</>
		);
	}
}
