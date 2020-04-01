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

import { Drive as DrivelistDrive } from 'drivelist';
import * as _ from 'lodash';
import * as React from 'react';
import { Modal } from 'rendition';

import {
	COMPATIBILITY_STATUS_TYPES,
	getDriveImageCompatibilityStatuses,
	hasListDriveImageCompatibilityStatus,
	isDriveValid,
} from '../../../../shared/drive-constraints';
import { bytesToClosestUnit } from '../../../../shared/units';
import { getDrives, hasAvailableDrives } from '../../models/available-drives';
import * as selectionState from '../../models/selection-state';
import { store } from '../../models/store';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';

/**
 * @summary Determine if we can change a drive's selection state
 */
function shouldChangeDriveSelectionState(drive: DrivelistDrive) {
	return isDriveValid(drive, selectionState.getImage());
}

/**
 * @summary Toggle a drive selection
 */
function toggleDrive(drive: DrivelistDrive) {
	const canChangeDriveSelectionState = shouldChangeDriveSelectionState(drive);

	if (canChangeDriveSelectionState) {
		analytics.logEvent('Toggle drive', {
			drive,
			previouslySelected: selectionState.isDriveSelected(drive.device),
			applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
			flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
		});

		selectionState.toggleDrive(drive.device);
	}
}

/**
 * @summary Get a drive's compatibility status object(s)
 *
 * @description
 * Given a drive, return its compatibility status with the selected image,
 * containing the status type (ERROR, WARNING), and accompanying
 * status message.
 */
function getDriveStatuses(
	drive: DrivelistDrive,
): Array<{ type: number; message: string }> {
	return getDriveImageCompatibilityStatuses(drive, selectionState.getImage());
}

function keyboardToggleDrive(
	drive: DrivelistDrive,
	event: React.KeyboardEvent<HTMLDivElement>,
) {
	const ENTER = 13;
	const SPACE = 32;
	if (_.includes([ENTER, SPACE], event.keyCode)) {
		toggleDrive(drive);
	}
}

interface DriverlessDrive {
	link: string;
	linkTitle: string;
	linkMessage: string;
}

export function DriveSelectorModal({ close }: { close: () => void }) {
	const defaultMissingDriversModalState: { drive?: DriverlessDrive } = {};
	const [missingDriversModal, setMissingDriversModal] = React.useState(
		defaultMissingDriversModalState,
	);
	const [drives, setDrives] = React.useState(getDrives());

	React.useEffect(() => {
		const unsubscribe = store.subscribe(() => {
			setDrives(getDrives());
		});
		return unsubscribe;
	});

	/**
	 * @summary Prompt the user to install missing usbboot drivers
	 */
	function installMissingDrivers(drive: {
		link: string;
		linkTitle: string;
		linkMessage: string;
	}) {
		if (drive.link) {
			analytics.logEvent('Open driver link modal', {
				url: drive.link,
				applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
				flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
			});
			setMissingDriversModal({ drive });
		}
	}

	/**
	 * @summary Select a drive and close the modal
	 */
	async function selectDriveAndClose(drive: DrivelistDrive) {
		const canChangeDriveSelectionState = await shouldChangeDriveSelectionState(
			drive,
		);

		if (canChangeDriveSelectionState) {
			selectionState.selectDrive(drive.device);

			analytics.logEvent('Drive selected (double click)', {
				applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
				flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
			});

			close();
		}
	}

	const hasStatus = hasListDriveImageCompatibilityStatus(
		selectionState.getSelectedDrives(),
		selectionState.getImage(),
	);

	return (
		<Modal
			className="modal-drive-selector-modal"
			title="Select a Drive"
			done={close}
			action="Continue"
			style={{
				padding: '20px 30px 11px 30px',
			}}
			primaryButtonProps={{
				primary: !hasStatus,
				warning: hasStatus,
			}}
		>
			<div>
				<ul
					style={{
						height: '250px',
						overflowX: 'hidden',
						overflowY: 'auto',
						padding: '0',
					}}
				>
					{_.map(drives, (drive, index) => {
						return (
							<li
								key={`item-${drive.displayName}`}
								className="list-group-item"
								// @ts-ignore (FIXME: not a valid <li> attribute but used by css rule)
								disabled={!isDriveValid(drive, selectionState.getImage())}
								onDoubleClick={() => selectDriveAndClose(drive)}
								onClick={() => toggleDrive(drive)}
							>
								{drive.icon && (
									<img
										className="list-group-item-section"
										alt="Drive device type logo"
										src={`../assets/${drive.icon}.svg`}
										width="25"
										height="30"
									/>
								)}
								<div
									className="list-group-item-section list-group-item-section-expanded"
									tabIndex={15 + index}
									onKeyPress={evt => keyboardToggleDrive(drive, evt)}
								>
									<h6 className="list-group-item-heading">
										{drive.description}
										{drive.size && (
											<span className="word-keep">
												{' '}
												- {bytesToClosestUnit(drive.size)}
											</span>
										)}
									</h6>
									{!drive.link && (
										<p className="list-group-item-text">{drive.displayName}</p>
									)}
									{drive.link && (
										<p className="list-group-item-text">
											{drive.displayName} -{' '}
											<b>
												<a onClick={() => installMissingDrivers(drive)}>
													{drive.linkCTA}
												</a>
											</b>
										</p>
									)}

									<footer className="list-group-item-footer">
										{_.map(getDriveStatuses(drive), (status, idx) => {
											const className = {
												[COMPATIBILITY_STATUS_TYPES.WARNING]: 'label-warning',
												[COMPATIBILITY_STATUS_TYPES.ERROR]: 'label-danger',
											};
											return (
												<span
													key={`${drive.displayName}-status-${idx}`}
													className={`label ${className[status.type]}`}
												>
													{status.message}
												</span>
											);
										})}
									</footer>
									{Boolean(drive.progress) && (
										<progress
											className="drive-init-progress"
											value={drive.progress}
											max="100"
										></progress>
									)}
								</div>

								{isDriveValid(drive, selectionState.getImage()) && (
									<span
										className="list-group-item-section tick tick--success"
										// @ts-ignore (FIXME: not a valid <span> attribute but used by css rule)
										disabled={!selectionState.isDriveSelected(drive.device)}
									></span>
								)}
							</li>
						);
					})}
					{!hasAvailableDrives() && (
						<li className="list-group-item">
							<div>
								<b>Connect a drive!</b>
								<div>No removable drive detected.</div>
							</div>
						</li>
					)}
				</ul>
			</div>

			{missingDriversModal.drive !== undefined && (
				<Modal
					width={400}
					title={missingDriversModal.drive.linkTitle}
					cancel={() => setMissingDriversModal({})}
					done={() => {
						try {
							if (missingDriversModal.drive !== undefined) {
								openExternal(missingDriversModal.drive.link);
							}
						} catch (error) {
							analytics.logException(error);
						} finally {
							setMissingDriversModal({});
						}
					}}
					action={'Yes, continue'}
					cancelButtonProps={{
						children: 'Cancel',
					}}
					children={
						missingDriversModal.drive.linkMessage ||
						`Etcher will open ${missingDriversModal.drive.link} in your browser`
					}
				></Modal>
			)}
		</Modal>
	);
}
