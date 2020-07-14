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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { scanner, sourceDestination } from 'etcher-sdk';
import * as React from 'react';
import { Flex } from 'rendition/dist_esm5/components/Flex';
import { ModalProps } from 'rendition/dist_esm5/components/Modal';
import Txt from 'rendition/dist_esm5/components/Txt';
import Badge from 'rendition/dist_esm5/components/Badge';
import Link from 'rendition/dist_esm5/components/Link';
import Table, { TableColumn } from 'rendition/dist_esm5/components/Table';
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
import { logEvent, logException } from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { Modal, ScrollableFlex } from '../../styled-components';

import TargetSVGIcon from '../../../assets/tgt.svg';

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

type Target = scanner.adapters.DrivelistDrive | DriverlessDrive | UsbbootDrive;

function isUsbbootDrive(drive: Target): drive is UsbbootDrive {
	return (drive as UsbbootDrive).progress !== undefined;
}

function isDriverlessDrive(drive: Target): drive is DriverlessDrive {
	return (drive as DriverlessDrive).link !== undefined;
}

function isDrivelistDrive(
	drive: Target,
): drive is scanner.adapters.DrivelistDrive {
	return typeof (drive as scanner.adapters.DrivelistDrive).size === 'number';
}

const TargetsTable = styled(({ refFn, ...props }) => {
	return (
		<div>
			<Table<Target> ref={refFn} {...props} />
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

interface TargetSelectorModalProps extends Omit<ModalProps, 'done'> {
	done: (targets: scanner.adapters.DrivelistDrive[]) => void;
}

interface TargetSelectorModalState {
	drives: Target[];
	image: Image;
	missingDriversModal: { drive?: DriverlessDrive };
	selectedList: scanner.adapters.DrivelistDrive[];
	showSystemDrives: boolean;
}

export class TargetSelectorModal extends React.Component<
	TargetSelectorModalProps,
	TargetSelectorModalState
> {
	unsubscribe: () => void;
	tableColumns: Array<TableColumn<Target>>;

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
				render: (description: string, drive: Target) => {
					return isDrivelistDrive(drive) && drive.isSystem ? (
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
				field: 'description',
				key: 'size',
				label: 'Size',
				render: (_description: string, drive: Target) => {
					if (isDrivelistDrive(drive) && drive.size !== null) {
						return bytesToClosestUnit(drive.size);
					}
				},
			},
			{
				field: 'description',
				key: 'link',
				label: 'Location',
				render: (_description: string, drive: Target) => {
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
				render: (_description: string, drive: Target) => {
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

	private driveShouldBeDisabled(drive: Target, image: any) {
		return (
			isUsbbootDrive(drive) ||
			isDriverlessDrive(drive) ||
			!isDriveValid(drive, image)
		);
	}

	private getDisplayedTargets(targets: Target[]): Target[] {
		return targets.filter((drive) => {
			return (
				isUsbbootDrive(drive) ||
				isDriverlessDrive(drive) ||
				isDriveSelected(drive.device) ||
				this.state.showSystemDrives ||
				!drive.isSystem
			);
		});
	}

	private getDisabledTargets(drives: Target[], image: any): string[] {
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
		this.unsubscribe();
	}

	render() {
		const { cancel, done, ...props } = this.props;
		const { selectedList, drives, image, missingDriversModal } = this.state;

		const displayedTargets = this.getDisplayedTargets(drives);
		const disabledTargets = this.getDisabledTargets(drives, image);
		const numberOfSystemDrives = drives.filter(
			(drive) => isDrivelistDrive(drive) && drive.isSystem,
		).length;
		const numberOfDisplayedSystemDrives = displayedTargets.filter(
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
							<TargetSVGIcon width="40px" height="90px" />
							<b>Plug a target drive</b>
						</Flex>
					) : (
						<ScrollableFlex flexDirection="column" width="100%">
							<TargetsTable
								refFn={(t: Table<Target>) => {
									if (t !== null) {
										t.setRowSelection(selectedList);
									}
								}}
								columns={this.tableColumns}
								data={displayedTargets}
								disabledRows={disabledTargets}
								rowKey="displayName"
								onCheck={(rows: Target[]) => {
									this.setState({
										selectedList: rows.filter(isDrivelistDrive),
									});
								}}
								onRowClick={(row: Target) => {
									if (
										!isDrivelistDrive(row) ||
										this.driveShouldBeDisabled(row, image)
									) {
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
							{numberOfHiddenSystemDrives > 0 && (
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
