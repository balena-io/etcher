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
import * as React from 'react';
import {
	Badge,
	Table,
	Txt,
	Flex,
	Link,
	TableColumn,
	ModalProps,
} from 'rendition';
import styled from 'styled-components';

import {
	getDriveImageCompatibilityStatuses,
	hasListDriveImageCompatibilityStatus,
	isDriveValid,
	TargetStatus,
	Image,
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
function getDriveStatuses(
	drive: DrivelistTarget,
	image: Image,
): TargetStatus[] {
	return getDriveImageCompatibilityStatuses(drive, image);
}

const ScrollableFlex = styled(Flex)`
	overflow: auto;

	::-webkit-scrollbar {
		display: none;
	}
`;

const TargetsTable = styled(({ refFn, ...props }) => {
	return (
		<div>
			<Table<DrivelistTarget> ref={refFn} {...props} />
		</div>
	);
})`
	> div {
		overflow: visible;
	}

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

interface TableData extends DrivelistTarget {
	disabled: boolean;
	extra: TargetStatus[] | number;
}

interface TargetSelectorModalProps extends Omit<ModalProps, 'done'> {
	done: (targets: DrivelistTarget[]) => void;
}

interface TargetSelectorModalState {
	drives: any[];
	image: Image;
	missingDriversModal: { drive?: DriverlessDrive };
	selectedList: any[];
	showSystemDrives: boolean;
}

export class TargetSelectorModal extends React.Component<
	TargetSelectorModalProps,
	TargetSelectorModalState
> {
	unsubscribe: () => void;
	tableColumns: Array<TableColumn<TableData>>;

	constructor(props: TargetSelectorModalProps) {
		super(props);

		const defaultMissingDriversModalState: { drive?: DriverlessDrive } = {};
		const selectedList = getSelectedDrives();

		this.state = {
			drives: getDrives(),
			image: getImage(),
			missingDriversModal: defaultMissingDriversModalState,
			selectedList,
			showSystemDrives: false,
		};

		this.tableColumns = [
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
				render: bytesToClosestUnit,
			},
			{
				field: 'link',
				label: 'Location',
				render: (link: string, drive: DrivelistTarget) => {
					return link ? (
						<Txt>
							{drive.displayName} -{' '}
							<b>
								<a onClick={() => this.installMissingDrivers(drive)}>
									{drive.linkCTA}
								</a>
							</b>
						</Txt>
					) : (
						<Txt>{drive.displayName}</Txt>
					);
				},
			},
			{
				field: 'extra',
				label: ' ',
				render: (extra: TargetStatus[] | number) => {
					if (typeof extra === 'number') {
						return this.renderProgress(extra);
					}
					return this.renderStatuses(extra);
				},
			},
		];
	}

	private buildTableData(drives: any[], image: any) {
		return drives.map((drive) => {
			return {
				...drive,
				extra:
					drive.progress !== undefined
						? drive.progress
						: getDriveStatuses(drive, image),
				disabled: !isDriveValid(drive, image) || drive.progress !== undefined,
			};
		});
	}

	private getDisplayedTargets(enrichedDrivesData: any[]) {
		return enrichedDrivesData.filter((drive) => {
			const showIfSystemDrive = this.state.showSystemDrives || !drive.isSystem;
			return isDriveSelected(drive.device) || showIfSystemDrive;
		});
	}

	private getDisabledTargets(drives: any[], image: any): TableData[] {
		return drives
			.filter(
				(drive) => !isDriveValid(drive, image) || drive.progress !== undefined,
			)
			.map((drive) => drive.displayName);
	}

	private renderProgress(progress: number) {
		return (
			<Flex flexDirection="column">
				<Txt fontSize={12}>Initializing device</Txt>
				<InitProgress value={progress} />
			</Flex>
		);
	}

	private renderStatuses(statuses: TargetStatus[]) {
		return (
			// the column render fn expects a single Element
			<>
				{statuses.map((status) => {
					const badgeShade = badgeShadeFromStatus(status.message);
					return (
						<Badge key={status.message} shade={badgeShade}>
							{status.message}
						</Badge>
					);
				})}
			</>
		);
	}

	private installMissingDrivers(drive: {
		link: string;
		linkTitle: string;
		linkMessage: string;
	}) {
		if (drive.link) {
			analytics.logEvent('Open driver link modal', {
				url: drive.link,
			});
			this.setState({ missingDriversModal: { drive } });
		}
	}

	componentDidMount() {
		this.unsubscribe = store.subscribe(() => {
			const drives = getDrives();
			const image = getImage();
			this.setState({
				drives,
				image,
				selectedList: getSelectedDrives(),
			});
		});
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	render() {
		const { cancel, done, ...props } = this.props;
		const {
			selectedList,
			showSystemDrives,
			drives,
			image,
			missingDriversModal,
		} = this.state;

		const targetsWithTableData = this.buildTableData(drives, image);
		const displayedTargets = this.getDisplayedTargets(targetsWithTableData);
		const disabledTargets = this.getDisabledTargets(drives, image);
		const numberOfSystemDrives = drives.filter((drive) => drive.isSystem)
			.length;
		const numberOfDisplayedSystemDrives = displayedTargets.filter(
			(drive) => drive.isSystem,
		).length;
		const numberOfHiddenSystemDrives =
			numberOfSystemDrives - numberOfDisplayedSystemDrives;
		const hasStatus = hasListDriveImageCompatibilityStatus(selectedList, image);

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
				done={() => done(selectedList)}
				action="Continue"
				style={{
					width: '780px',
					height: '420px',
				}}
				primaryButtonProps={{
					primary: !hasStatus,
					warning: hasStatus,
					disabled: !hasAvailableDrives(),
				}}
				{...props}
			>
				<Flex width="100%" height="100%">
					{!hasAvailableDrives() ? (
						<Flex justifyContent="center" alignItems="center" width="100%">
							<b>Plug a target drive</b>
						</Flex>
					) : (
						<ScrollableFlex
							flexDirection="column"
							width="100%"
							height="calc(100% - 15px)"
						>
							<TargetsTable
								refFn={(t: Table<TableData>) => {
									if (t !== null) {
										t.setRowSelection(selectedList);
									}
								}}
								columns={this.tableColumns}
								data={displayedTargets}
								disabledRows={disabledTargets}
								rowKey="displayName"
								onCheck={(rows: TableData[]) => {
									this.setState({
										selectedList: rows,
									});
								}}
								onRowClick={(row: TableData) => {
									if (row.disabled) {
										return;
									}
									const newList = [...selectedList];
									const selectedIndex = selectedList.findIndex(
										(target) => target.device === row.device,
									);
									if (selectedIndex === -1) {
										newList.push(row);
									} else {
										// Deselect if selected
										newList.splice(selectedIndex, 1);
									}
									this.setState({
										selectedList: newList,
									});
								}}
							/>
							{!showSystemDrives && numberOfHiddenSystemDrives > 0 && (
								<Link
									mt={15}
									mb={15}
									onClick={() => this.setState({ showSystemDrives: true })}
								>
									<Flex alignItems="center">
										<FontAwesomeIcon icon={faChevronDown} />
										<Txt ml={8}>Show {numberOfHiddenSystemDrives} hidden</Txt>
									</Flex>
								</Link>
							)}
						</ScrollableFlex>
					)}
				</Flex>

				{missingDriversModal.drive !== undefined && (
					<Modal
						width={400}
						title={missingDriversModal.drive.linkTitle}
						cancel={() => this.setState({ missingDriversModal: {} })}
						done={() => {
							try {
								if (missingDriversModal.drive !== undefined) {
									openExternal(missingDriversModal.drive.link);
								}
							} catch (error) {
								analytics.logException(error);
							} finally {
								this.setState({ missingDriversModal: {} });
							}
						}}
						action="Yes, continue"
						cancelButtonProps={{
							children: 'Cancel',
						}}
						children={
							missingDriversModal.drive.linkMessage ||
							`Etcher will open ${missingDriversModal.drive.link} in your browser`
						}
					/>
				)}
			</Modal>
		);
	}
}
