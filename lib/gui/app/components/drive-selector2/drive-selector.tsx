/*
 * Copyright 2019 resin.io
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

import { Meter } from 'grommet';
import { sortBy } from 'lodash';
import * as React from 'react';
import { Badge, Modal, Table } from 'rendition';

import { getDrives } from '../../models/available-drives';
import { COMPATIBILITY_STATUS_TYPES } from '../../modules/drive-constraints';
import { subscribe } from '../../models/store';
import { ThemedProvider } from '../../styled-components';
import { bytesToClosestUnit } from '../../modules/units';

interface Drive {
	description: string;
	device: string;
	isSystem: boolean;
	isReadOnly: boolean;
	progress?: number;
	size?: number;
	link?: string;
	linkCTA?: string;
	displayName: string;
}

interface CompatibilityStatus {
	type: number;
	message: string;
}

interface DriveSelectorProps {
	close: () => void;
  selectDrive: (drive: Drive) => void;
  deselectDrive: (drive: Drive) => void;
  isDriveSelected: (drive: Drive) => boolean;
	isDriveValid: (drive: Drive) => boolean;
	getDriveBadges: (drive: Drive) => CompatibilityStatus[];
}

interface DriveSelectorState {
	drives: Drive[];
	selected: Drive[];
	disabledDrives: string[];
}

const modalStyle = {
	width: '800px',
	height: '600px',
	paddingTop: '20px',
	paddingLeft: '30px',
	paddingRight: '30px',
	paddingBottom: '11px',
};

const titleStyle = {
	color: '#2a506f',
};

const subtitleStyle = {
	marginLeft: '10px',
	fontSize: '11px',
	color: '#5b82a7',
};

const wrapperStyle = {
	height: '250px',
	overflowX: 'hidden' as 'hidden',
	overflowY: 'auto' as 'auto',
};

export class DriveSelector2 extends React.Component<
	DriveSelectorProps,
	DriveSelectorState
> {
	private table: Table<Drive> | null = null;
	private columns: {
		field: keyof Drive;
		label: string;
		render?: (value: any, row: Drive) => string | number | JSX.Element | null;
	}[];
	private unsubscribe?: () => void;

	constructor(props: DriveSelectorProps) {
		super(props);
		this.columns = [
			{
				field: 'description',
				label: 'Name',
			} as const,
			{
				field: 'size',
				label: 'Size',
				render: this.renderSize.bind(this),
			} as const,
			{
				field: 'displayName',
				label: 'Location',
				render: this.renderLocation.bind(this),
			} as const,
			{
				field: 'isReadOnly', // We don't use this, but a valid field that is not used in another column is required
				label: ' ',
				render: this.renderBadges.bind(this),
			} as const,
		];
		this.state = this.getNewState();
	}

	public componentDidMount() {
		this.update();
		if (this.unsubscribe === undefined) {
			this.unsubscribe = subscribe(this.update.bind(this));
		}
	}

	public componentWillUnmount() {
		if (this.unsubscribe !== undefined) {
			this.unsubscribe();
			this.unsubscribe = undefined;
		}
	}

	private getNewState() {
		let drives: Drive[] = getDrives();
		for (let i = 0; i < drives.length; i++) {
			drives[i] = { ...drives[i] };
		}
    drives = sortBy(drives, 'device');
		const selected = drives.filter(d => this.props.isDriveSelected(d));
		const disabledDrives = drives
			.filter(d => !this.props.isDriveValid(d))
			.map(d => d.device);
		return { drives, disabledDrives, selected };
	}

	private update() {
		this.setState(this.getNewState());
		this.updateTableSelection();
	}

	private updateTableSelection() {
		if (this.table !== null) {
			this.table.setRowSelection(this.state.selected);
		}
	}

	private renderSize(size: number) {
		if (size) {
			return bytesToClosestUnit(size);
		} else {
			return null;
		}
	}

	private renderLocation(displayName: string, drive: Drive) {
		const result: Array<string | JSX.Element> = [displayName];
		if (drive.link && drive.linkCTA) {
			result.push(<a href={drive.link}>{drive.linkCTA}</a>);
		}
		return <React.Fragment>{result}</React.Fragment>;
	}

	private renderBadges(_value: any, row: Drive) {
		const result = [];
		if (row.progress !== undefined) {
			result.push(
				<Meter
					size="small"
					thickness="xxsmall"
					values={[
						{
							value: row.progress,
							label: row.progress + '%',
							color: '#2297de',
						},
					]}
				/>,
			);
		}
		result.push(
			...this.props.getDriveBadges(row).map(
				(status: CompatibilityStatus) => {
					const props: {
						key: string;
						xsmall: true;
						danger?: boolean;
						warning?: boolean;
					} = { xsmall: true, key: status.message };
					if (status.type === COMPATIBILITY_STATUS_TYPES.ERROR) {
						props.danger = true;
					} else if (status.type === COMPATIBILITY_STATUS_TYPES.WARNING) {
						props.warning = true;
					}
					return <Badge {...props}>{status.message}</Badge>;
				},
			),
		);
		return <React.Fragment>{result}</React.Fragment>;
	}

	private renderTbodyPrefix() {
		if (this.state.drives.length === 0) {
			return (
				<tr>
					<td colSpan={this.columns.length} style={{ textAlign: 'center' }}>
						<b>Connect a drive</b>
						<div>No removable drive detected.</div>
					</td>
				</tr>
			);
		}
	}

	public render() {
		return (
			<ThemedProvider>
				<Modal
					titleElement={
						<div style={titleStyle}>
							Available targets
							<span style={subtitleStyle}>
								{this.state.drives.length} found
							</span>
						</div>
					}
					action={`Select (${this.state.selected.length})`}
					style={modalStyle}
					done={this.props.close}
				>
					<div style={wrapperStyle}>
						<Table<Drive>
							ref={t => {
								this.table = t;
								this.updateTableSelection();
							}}
							rowKey="device"
							onCheck={this.onCheck.bind(this)}
							columns={this.columns}
							data={this.state.drives}
							disabledRows={this.state.disabledDrives}
							tbodyPrefix={this.renderTbodyPrefix()}
						/>
					</div>
				</Modal>
			</ThemedProvider>
		);
	}

	private onCheck(checkedDrives: Drive[]): void {
		const checkedDevices = checkedDrives.map(d => d.device);
		for (const drive of getDrives()) {
			if (checkedDevices.indexOf(drive.device) !== -1) {
				this.props.selectDrive(drive);
			} else {
				this.props.deselectDrive(drive);
			}
		}
	}
}
