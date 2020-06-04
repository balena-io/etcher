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

import {
	faChevronDown,
	faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { Drive as DrivelistDrive } from 'drivelist';
import * as _ from 'lodash';
import * as React from 'react';
import { Badge, Table as BaseTable, Txt, Flex, Link } from 'rendition';
import styled from 'styled-components';

import {
	getDriveImageCompatibilityStatuses,
	hasListDriveImageCompatibilityStatus,
	isDriveValid,
	hasDriveImageCompatibilityStatus,
	TargetStatus,
} from '../../../../shared/drive-constraints';
import { compatibility } from '../../../../shared/messages';
import { bytesToClosestUnit } from '../../../../shared/units';
import { getDrives, hasAvailableDrives } from '../../models/available-drives';
import {
	getImage,
	getSelectedDrives,
	isDriveSelected,
} from '../../models/selection-state';
import { store } from '../../models/store';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { Modal } from '../../styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface DrivelistTarget extends DrivelistDrive {
	displayName: string;
	progress: number;
	device: string;
	link: string;
	linkTitle: string;
	linkMessage: string;
	linkCTA: string;
}

/**
 * @summary Get a drive's compatibility status object(s)
 *
 * @description
 * Given a drive, return its compatibility status with the selected image,
 * containing the status type (ERROR, WARNING), and accompanying
 * status message.
 */
function getDriveStatuses(drive: DrivelistTarget): TargetStatus[] {
	return getDriveImageCompatibilityStatuses(drive, getImage());
}

const TargetsTable = styled(({ refFn, ...props }) => {
	return <BaseTable<DrivelistTarget> ref={refFn} {...props}></BaseTable>;
})`
	[data-display='table-head']
		[data-display='table-row']
		> [data-display='table-cell']:first-child {
		padding-left: 15px;
	}

	[data-display='table-head']
		[data-display='table-row']
		> [data-display='table-cell'] {
		padding: 6px 8px;
		color: #2a506f;
	}

	[data-display='table-body']
		> [data-display='table-row']
		> [data-display='table-cell']:first-child {
		padding-left: 15px;
	}

	[data-display='table-body']
		> [data-display='table-row']
		> [data-display='table-cell'] {
		padding: 6px 8px;
		color: #2a506f;
	}
`;

interface DriverlessDrive {
	link: string;
	linkTitle: string;
	linkMessage: string;
}

function badgeShadeFromStatus(status: string) {
	switch (status) {
		case compatibility.containsImage():
			return 16;
		case compatibility.system():
			return 5;
		default:
			return 14;
	}
}

function renderStatuses(statuses: TargetStatus[]) {
	return _.map(statuses, (status) => {
		const badgeShade = badgeShadeFromStatus(status.message);
		return (
			<Badge key={status.message} shade={badgeShade}>
				{status.message}
			</Badge>
		);
	});
}

const InitProgress = styled(
	({
		value,
		...props
	}: {
		value: number;
		props?: React.ProgressHTMLAttributes<Element>;
	}) => {
		return <progress max="100" value={value} {...props}></progress>;
	},
)`
	/* Reset the default appearance */
	appearance: none;

	::-webkit-progress-bar {
		width: 130px;
		height: 4px;
		background-color: #dde1f0;
		border-radius: 14px;
	}

	::-webkit-progress-value {
		background-color: #1496e1;
		border-radius: 14px;
	}
`;

function renderProgress(progress: number) {
	if (progress) {
		return (
			<Flex flexDirection="column">
				<Txt fontSize={12}>Initializing device</Txt>
				<InitProgress value={progress} />
			</Flex>
		);
	}
}

interface TableData extends DrivelistTarget {
	disabled: boolean;
}

export const TargetSelectorModal = ({
	close,
	cancel,
}: {
	close: (targets: DrivelistTarget[]) => void;
	cancel: () => void;
}) => {
	const defaultMissingDriversModalState: { drive?: DriverlessDrive } = {};
	const [missingDriversModal, setMissingDriversModal] = React.useState(
		defaultMissingDriversModalState,
	);
	const [drives, setDrives] = React.useState(getDrives());
	const [selectedList, setSelected] = React.useState(getSelectedDrives());
	const [showSystemDrives, setShowSystemDrives] = React.useState(false);
	const image = getImage();
	const hasStatus = hasListDriveImageCompatibilityStatus(selectedList, image);

	const enrichedDrivesData = _.map(drives, (drive) => {
		return {
			...drive,
			extra: drive.progress || getDriveStatuses(drive),
			disabled: !isDriveValid(drive, image) || drive.progress,
			highlighted: hasDriveImageCompatibilityStatus(drive, image),
		};
	});
	const normalDrives = _.reject(
		enrichedDrivesData,
		(drive) => drive.isSystem && !isDriveSelected(drive.device),
	);
	const systemDrives = _.filter(enrichedDrivesData, 'isSystem');
	const disabledRows = _.map(
		_.filter(drives, (drive) => {
			return !isDriveValid(drive, image) || drive.progress;
		}),
		'displayName',
	);

	const columns = [
		{
			field: 'description',
			label: 'Name',
			render: (description: string, drive: DrivelistTarget) => {
				return drive.isSystem ? (
					<Flex alignItems="center">
						<FontAwesomeIcon
							style={{ color: '#fca321' }}
							icon={faExclamationTriangle}
						/>
						<Txt ml={8}>{description}</Txt>
					</Flex>
				) : (
					<Txt>{description}</Txt>
				);
			},
		},
		{
			field: 'size',
			label: 'Size',
			render: (size: number) => {
				return bytesToClosestUnit(size);
			},
		},
		{
			field: 'link',
			label: 'Location',
			render: (link: string, drive: DrivelistTarget) => {
				return !link ? (
					<Txt>{drive.displayName}</Txt>
				) : (
					<Txt>
						{drive.displayName} -{' '}
						<b>
							<a onClick={() => installMissingDrivers(drive)}>
								{drive.linkCTA}
							</a>
						</b>
					</Txt>
				);
			},
		},
		{
			field: 'extra',
			label: ' ',
			render: (extra: TargetStatus[] | number) => {
				if (typeof extra === 'number') {
					return renderProgress(extra);
				}
				return renderStatuses(extra);
			},
		},
	];

	React.useEffect(() => {
		const unsubscribe = store.subscribe(() => {
			setDrives(getDrives());
			setSelected(getSelectedDrives());
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

	return (
		<Modal
			titleElement={
				<Flex alignItems="baseline" mb={18}>
					<Txt fontSize={24} align="left">
						Select target
					</Txt>
					<Txt
						fontSize={11}
						ml={12}
						color="#5b82a7"
						style={{ fontWeight: 600 }}
					>
						{drives.length} found
					</Txt>
				</Flex>
			}
			titleDetails={<Txt fontSize={11}>{getDrives().length} found</Txt>}
			cancel={cancel}
			done={() => close(selectedList)}
			action="Continue"
			style={{
				width: '780px',
				height: '420px',
			}}
			primaryButtonProps={{
				primary: !hasStatus,
				warning: hasStatus,
			}}
		>
			<div>
				{!hasAvailableDrives() ? (
					<div style={{ textAlign: 'center', margin: '0 auto' }}>
						<b>Plug a target drive</b>
					</div>
				) : (
					<Flex
						flexDirection="column"
						style={{ maxHeight: !showSystemDrives ? 250 : 265 }}
					>
						<TargetsTable
							refFn={(t: BaseTable<TableData>) => {
								if (!_.isNull(t)) {
									t.setRowSelection(selectedList);
								}
							}}
							columns={columns}
							data={_.uniq(
								showSystemDrives
									? normalDrives.concat(systemDrives)
									: normalDrives,
							)}
							disabledRows={disabledRows}
							rowKey="displayName"
							onCheck={(rows: TableData[]) => {
								setSelected(rows);
							}}
							onRowClick={(row: TableData) => {
								if (!row.disabled) {
									const selectedIndex = selectedList.findIndex(
										(target) => target.device === row.device,
									);
									if (selectedIndex === -1) {
										selectedList.push(row);
										setSelected(_.map(selectedList));
										return;
									}
									// Deselect if selected
									setSelected(
										_.reject(
											selectedList,
											(drive) =>
												selectedList[selectedIndex].device === drive.device,
										),
									);
								}
							}}
						></TargetsTable>
						{!showSystemDrives && (
							<Link mt={16} onClick={() => setShowSystemDrives(true)}>
								<Flex alignItems="center">
									<FontAwesomeIcon icon={faChevronDown} />
									<Txt ml={8}>
										Show {drives.length - normalDrives.length} hidden
									</Txt>
								</Flex>
							</Link>
						)}
					</Flex>
				)}
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
};
