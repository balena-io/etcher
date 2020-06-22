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

import ExclamationTriangleSvg from '@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
import ChevronDownSvg from '@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
import { scanner, sourceDestination } from 'etcher-sdk';
import * as React from 'react';
import {
	Flex,
	ModalProps,
	Txt,
	Badge,
	Link,
	Table,
	TableColumn,
} from 'rendition';
import styled from 'styled-components';

import {
	getDriveImageCompatibilityStatuses,
	hasListDriveImageCompatibilityStatus,
	isDriveValid,
	DriveStatus,
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
import { logEvent, logException } from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { Modal, ScrollableFlex } from '../../styled-components';

import DriveSVGIcon from '../../../assets/tgt.svg';

interface UsbbootDrive extends sourceDestination.UsbbootDrive {
	progress: number;
}

interface DriverlessDrive {
	displayName: string; // added in app.ts
	description: string;
	link: string;
	linkTitle: string;
	linkMessage: string;
	linkCTA: string;
}

type Drive = scanner.adapters.DrivelistDrive | DriverlessDrive | UsbbootDrive;

function isUsbbootDrive(drive: Drive): drive is UsbbootDrive {
	return (drive as UsbbootDrive).progress !== undefined;
}

function isDriverlessDrive(drive: Drive): drive is DriverlessDrive {
	return (drive as DriverlessDrive).link !== undefined;
}

function isDrivelistDrive(
	drive: Drive,
): drive is scanner.adapters.DrivelistDrive {
	return typeof (drive as scanner.adapters.DrivelistDrive).size === 'number';
}

const DrivesTable = styled(({ refFn, ...props }) => {
	return (
		<div>
			<Table<Drive> ref={refFn} {...props} />
		</div>
	);
})`
	[data-display='table-head'] [data-display='table-cell'] {
		position: sticky;
		top: 0;
		background-color: ${(props) => props.theme.colors.quartenary.light};
	}

	[data-display='table-cell']:first-child {
		padding-left: 15px;
	}

	[data-display='table-cell']:last-child {
		width: 150px;
	}

	&& [data-display='table-row'] > [data-display='table-cell'] {
		padding: 6px 8px;
		color: #2a506f;
	}
`;

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
		return <progress max="100" value={value} {...props} />;
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

export interface DriveSelectorProps
	extends Omit<ModalProps, 'done' | 'cancel'> {
	multipleSelection?: boolean;
	cancel: () => void;
	done: (drives: scanner.adapters.DrivelistDrive[]) => void;
	titleLabel: string;
	emptyListLabel: string;
}

interface DriveSelectorState {
	drives: Drive[];
	image: Image;
	missingDriversModal: { drive?: DriverlessDrive };
	selectedList: scanner.adapters.DrivelistDrive[];
	showSystemDrives: boolean;
}

export class DriveSelector extends React.Component<
	DriveSelectorProps,
	DriveSelectorState
> {
	private unsubscribe: (() => void) | undefined;
	multipleSelection: boolean = true;
	tableColumns: Array<TableColumn<Drive>>;

	constructor(props: DriveSelectorProps) {
		super(props);

		const defaultMissingDriversModalState: { drive?: DriverlessDrive } = {};
		const selectedList = getSelectedDrives();
		const multipleSelection = this.props.multipleSelection;
		this.multipleSelection =
			multipleSelection !== undefined
				? !!multipleSelection
				: this.multipleSelection;

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
				render: (description: string, drive: Drive) => {
					return isDrivelistDrive(drive) && drive.isSystem ? (
						<Flex alignItems="center">
							<ExclamationTriangleSvg height="1em" fill="#fca321" />
							<Txt ml={8}>{description}</Txt>
						</Flex>
					) : (
						<Txt>{description}</Txt>
					);
				},
			},
			{
				field: 'description',
				key: 'size',
				label: 'Size',
				render: (_description: string, drive: Drive) => {
					if (isDrivelistDrive(drive) && drive.size !== null) {
						return bytesToClosestUnit(drive.size);
					}
				},
			},
			{
				field: 'description',
				key: 'link',
				label: 'Location',
				render: (_description: string, drive: Drive) => {
					return (
						<Txt>
							{drive.displayName}
							{isDriverlessDrive(drive) && (
								<>
									{' '}
									-{' '}
									<b>
										<a onClick={() => this.installMissingDrivers(drive)}>
											{drive.linkCTA}
										</a>
									</b>
								</>
							)}
						</Txt>
					);
				},
			},
			{
				field: 'description',
				key: 'extra',
				// Space as empty string would use the field name as label
				label: ' ',
				render: (_description: string, drive: Drive) => {
					if (isUsbbootDrive(drive)) {
						return this.renderProgress(drive.progress);
					} else if (isDrivelistDrive(drive)) {
						return this.renderStatuses(
							getDriveImageCompatibilityStatuses(drive, this.state.image),
						);
					}
				},
			},
		];
	}

	private driveShouldBeDisabled(drive: Drive, image: any) {
		return (
			isUsbbootDrive(drive) ||
			isDriverlessDrive(drive) ||
			!isDriveValid(drive, image)
		);
	}

	private getDisplayedDrives(drives: Drive[]): Drive[] {
		return drives.filter((drive) => {
			return (
				isUsbbootDrive(drive) ||
				isDriverlessDrive(drive) ||
				isDriveSelected(drive.device) ||
				this.state.showSystemDrives ||
				!drive.isSystem
			);
		});
	}

	private getDisabledDrives(drives: Drive[], image: any): string[] {
		return drives
			.filter((drive) => this.driveShouldBeDisabled(drive, image))
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

	private renderStatuses(statuses: DriveStatus[]) {
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

	private installMissingDrivers(drive: DriverlessDrive) {
		if (drive.link) {
			logEvent('Open driver link modal', {
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
		this.unsubscribe?.();
	}

	render() {
		const { cancel, done, ...props } = this.props;
		const { selectedList, drives, image, missingDriversModal } = this.state;

		const displayedDrives = this.getDisplayedDrives(drives);
		const disabledDrives = this.getDisabledDrives(drives, image);
		const numberOfSystemDrives = drives.filter(
			(drive) => isDrivelistDrive(drive) && drive.isSystem,
		).length;
		const numberOfDisplayedSystemDrives = displayedDrives.filter(
			(drive) => isDrivelistDrive(drive) && drive.isSystem,
		).length;
		const numberOfHiddenSystemDrives =
			numberOfSystemDrives - numberOfDisplayedSystemDrives;
		const hasStatus = hasListDriveImageCompatibilityStatus(selectedList, image);

		return (
			<Modal
				titleElement={
					<Flex alignItems="baseline" mb={18}>
						<Txt fontSize={24} align="left">
							{this.props.titleLabel}
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
				action={`Select (${selectedList.length})`}
				primaryButtonProps={{
					primary: !hasStatus,
					warning: hasStatus,
					disabled: !hasAvailableDrives(),
				}}
				{...props}
			>
				<Flex width="100%" height="90%">
					{!hasAvailableDrives() ? (
						<Flex
							flexDirection="column"
							justifyContent="center"
							alignItems="center"
							width="100%"
						>
							<DriveSVGIcon width="40px" height="90px" />
							<b>{this.props.emptyListLabel}</b>
						</Flex>
					) : (
						<ScrollableFlex flexDirection="column" width="100%">
							<DrivesTable
								refFn={(t: Table<Drive>) => {
									if (t !== null) {
										t.setRowSelection(selectedList);
									}
								}}
								columns={this.tableColumns}
								data={displayedDrives}
								disabledRows={disabledDrives}
								rowKey="displayName"
								onCheck={(rows: Drive[]) => {
									const newSelection = rows.filter(isDrivelistDrive);
									if (this.multipleSelection) {
										this.setState({
											selectedList: newSelection,
										});
										return;
									}
									this.setState({
										selectedList: newSelection.slice(newSelection.length - 1),
									});
								}}
								onRowClick={(row: Drive) => {
									if (
										!isDrivelistDrive(row) ||
										this.driveShouldBeDisabled(row, image)
									) {
										return;
									}
									if (this.multipleSelection) {
										const newList = [...selectedList];
										const selectedIndex = selectedList.findIndex(
											(drive) => drive.device === row.device,
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
										return;
									}
									this.setState({
										selectedList: [row],
									});
								}}
							/>
							{numberOfHiddenSystemDrives > 0 && (
								<Link
									mt={15}
									mb={15}
									onClick={() => this.setState({ showSystemDrives: true })}
								>
									<Flex alignItems="center">
										<ChevronDownSvg height="1em" fill="currentColor" />
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
								logException(error);
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
